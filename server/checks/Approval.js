import Check from './Check'
import AuditEvent from '../service/audit/AuditEvent'
import { logger, formatDate } from '../../common/debug'
import { promiseReduce, getIn, toGenericComment } from '../../common/util'
import * as EVENTS from '../model/GithubEvents'
import * as AUDIT_EVENTS from '../service/audit/AuditEventTypes'
import * as _ from 'lodash'

const context = 'zappr'
const info = logger('approval', 'info')
const debug = logger('approval')
const error = logger('approval', 'error')

export default class Approval extends Check {

  static TYPE = 'approval'
  static CONTEXT = context
  static NAME = 'Approval check'
  static HOOK_EVENTS = [EVENTS.PULL_REQUEST, EVENTS.ISSUE_COMMENT]

  /**
   * @param {GithubService} github
   * @param {PullRequestHandler} pullRequestHandler
   * @param {AuditService} auditService
   */
  constructor(github, pullRequestHandler, auditService) {
    super()
    this.github = github
    this.pullRequestHandler = pullRequestHandler
    this.audit = auditService
  }

  /**
   * Checks if a database entry exists for the given pull request number
   * and returns it if it exists. Otherwise creates and returns a new one.
   *
   * @param dbRepoId The db id for the repository
   * @param {RepositoryHandler} Numbe/github identifier of the pull request
   * @returns {Object} The pull request information stored/created in the database.
   */
  async getOrCreateDbPullRequest(dbRepoId, number) {
    let dbPR = await this.pullRequestHandler.onGet(dbRepoId, number)
    if (!dbPR) {
      dbPR = await this.pullRequestHandler.onCreatePullRequest(dbRepoId, number)
    }
    return dbPR;
  }

  /**
   * Based on the Zappr approval configuration
   * and the approval statistics and number of vetos.
   * Generates a commit status object that it consumed by the Github Status API
   * (https://developer.github.com/v3/repos/statuses/#create-a-status).
   *
   * @param approvals Approval stats. Includes `total` approvals and group information.
   * @param vetos Number of vetos.
   * @param approvalConfig Approval configuration
   * @returns {Object} Object consumable by Github Status API
   */
  static generateStatus({approvals, vetos}, {minimum, groups}) {
    if (vetos.length > 0) {
      return {
        description: `Vetoes: ${vetos.map(u => `@${u}`).join(', ')}.`,
        state: 'failure',
        context
      }
    }

    if (Object.keys(approvals.groups || {}).length > 0) {
      // check group requirements
      const unsatisfied = Object.keys(approvals.groups)
                                .reduce((result, approvalGroup) => {
                                  const needed = groups[approvalGroup].minimum
                                  const given = approvals.groups[approvalGroup].length
                                  const diff = needed - given
                                  if (diff > 0) {
                                    result.push({approvalGroup, diff, needed, given})
                                  }
                                  return result
                                }, [])

      if (unsatisfied.length > 0) {
        const firstUnsatisfied = unsatisfied[0]
        return {
          description: `This PR misses ${firstUnsatisfied.diff} approvals from group ${firstUnsatisfied.approvalGroup} (${firstUnsatisfied.given}/${firstUnsatisfied.needed}).`,
          state: 'pending',
          context
        }
      }
    }

    if (approvals.total.length < minimum) {
      return {
        description: `This PR needs ${minimum - approvals.total.length} more approvals (${approvals.total.length}/${minimum} given).`,
        state: 'pending',
        context
      }
    }

    return {
      description: `Approvals: ${approvals.total.map(u => `@${u}`).join(', ')}.`,
      state: 'success',
      context
    }
  }

  /**
   * Returns the comment if it matches the config, null otherwise.
   */
  async doesCommentMatchConfig(repository, comment, fromConfig, token) {
    // persons must either be listed explicitly in users OR
    // be a collaborator OR
    // member of at least one of listed orgs
    const {orgs, collaborators, users} = fromConfig
    const username = comment.user
    const {full_name} = repository
    // first do the quick username check
    if (users && users.indexOf(username) >= 0) {
      debug(`${full_name}: ${username} is listed explicitly`)
      return comment
    }
    // now collaborators
    if (collaborators) {
      const isCollaborator = await this.github.isCollaborator(repository.owner.login, repository.name, username, token)
      if (isCollaborator) {
        debug(`${full_name}: ${username} is collaborator`)
        return comment
      }
    }
    // and orgs
    if (orgs) {
      const orgMember = await Promise.all(orgs.map(o => this.github.isMemberOfOrg(o, username, token)))
      if (orgMember.indexOf(true) >= 0) {
        debug(`${full_name}: ${username} is org member`)
        return comment
      }
    }
    debug(`${full_name}: ${username}'s approval does not count`)
    // okay, no member of anything
    return null
  }

  /**
   * Counts how many comments are there in total and per group.
   *
   * @param repository The repository
   * @param comments The comments to process
   * @param config The approval/veto configuration
   * @param token The access token to use
   * @returns {Object} Object of the shape {total: int, groups: { groupName: int } }
   */
  async getCommentStatsForConfig(repository, comments, config, token) {
    const that = this

    async function checkComment(stats, comment) {
      let matchesTotal = false
      if (config.from) {
        matchesTotal = await that.doesCommentMatchConfig(repository, comment, config.from, token)
        if (matchesTotal) {
          info(`${repository.full_name}: Counting ${comment.user}'s comment`)
          stats.total.push(comment.user)
        }
      } else {
        // if there is no from clause, every comment counts
        stats.total.push(comment.user)
        matchesTotal = true
      }
      if (config.groups) {
        await Promise.all(Object.keys(config.groups).map(async(group) => {
          // update group counter
          if (!stats.groups[group]) {
            stats.groups[group] = []
          }
          const matchesGroup = await that.doesCommentMatchConfig(repository, comment, config.groups[group].from, token)
          if (matchesGroup) {
            // counting this as total as well if it didn't before
            if (!matchesTotal) {
              info(`${repository.full_name}: Counting ${comment.user}'s comment`)
              stats.total.push(comment.user)
            }
            info(`${repository.full_name}: Counting ${comment.user}'s comment for group ${group}`)
            stats.groups[group].push(comment.user)
          }
        }))
      }
      return stats
    }

    return promiseReduce(comments, checkComment, {total: [], groups: {}})
  }

  /**
   * Removes comments from ignored users for approvals, comments that do not match approval/veto
   * pattern as well as multiple approvals/vetos by the same person and counts the
   * remaining approvals/vetos.
   *
   * @param repository The repository
   * @param pull_request The pull request
   * @param comments The comments to process
   * @param config The approval configuration
   * @param token The access token to use
   * @returns {Object} Object of the shape {approvals: {total: int, groups: { groupName: int }}, vetos: int }
   */
  async countApprovalsAndVetos(repository, pull_request, comments, config, token) {
    const ignore = await this.fetchIgnoredUsers(repository, pull_request, config, token)
    const approvalPattern = config.pattern
    const vetoPattern = _.get(config, 'veto.pattern')

    const fullName = `${repository.full_name}`
    // slightly unperformant filtering here:
    const containsAlreadyCommentByUser = (c1, i, cmts) => i === cmts.findIndex(c2 => c1.user === c2.user)
    // filter ignored users
    const potentialApprovalComments = comments.filter(comment => {
                                                const login = comment.user
                                                const include = ignore.indexOf(login) === -1
                                                if (!include) info('%s: Ignoring user: %s.', fullName, login)
                                                return include
                                              })
                                              // get comments that match specified approval pattern
                                              // TODO add unicode flag once available in node
                                              .filter(comment => {
                                                const text = comment.body.trim()
                                                const include = (new RegExp(approvalPattern)).test(text)
                                                if (!include) {
                                                  info('%s: Comment "%s" does not match pattern "%s".', fullName, text, approvalPattern)
                                                }
                                                return include
                                              })
                                              // kicking out multiple approvals from same person
                                              .filter(containsAlreadyCommentByUser)


    const approvals = (config.from || config.groups) ?
      await this.getCommentStatsForConfig(repository, potentialApprovalComments, config, token) :
    {total: potentialApprovalComments.map(c => c.user)}


    let vetos = []
    if (vetoPattern) {
      const potentialVetoComments = comments.filter(comment => {
                                              const text = comment.body.trim()
                                              const include = (new RegExp(vetoPattern)).test(text)
                                              return include
                                            })
                                            // kicking out multiple vetos from same person
                                            .filter(containsAlreadyCommentByUser)

      vetos = (config.from || config.groups) ?
        (await this.getCommentStatsForConfig(repository, potentialVetoComments, config, token)).total :
        potentialVetoComments.map(c => c.user)

    }

    return {
      approvals,
      vetos
    }
  }

  /**
   * Gets the users to ignore for a pull request in a repository, according to its
   * approval configuration.
   *
   * @param github The GithubService instance
   * @param repository The repository
   * @param pull_request The pull request
   * @param config The approval configuration
   * @param token The access token to use
   * @returns {Array} The logins of users to ignore
   */
  async fetchIgnoredUsers(repository, pull_request, config, token) {
    if (!config.ignore || config.ignore === 'none') {
      return []
    }
    const ignoreConfig = config.ignore
    const user = repository.owner.login
    const repoName = repository.name
    const ignoredUsers = []
    if (ignoreConfig === 'last_committer' || ignoreConfig === 'both') {
      const lastCommitter = await this.github.fetchLastCommitter(user, repoName, pull_request.number, token)
      if (lastCommitter) {
        ignoredUsers.push(lastCommitter)
      }
    }
    if (ignoreConfig === 'pr_opener' || ignoreConfig === 'both') {
      const prOpener = getIn(pull_request, ['user', 'login'])
      if (prOpener) {
        ignoredUsers.push(prOpener)
      }
    }
    return ignoredUsers
  }

  /**
   * Fetches data necessary to count approvals/vetos (e.g. when was last push on pull request,
   * comments on this pull request from Github) and counts approvals and vetos.
   *
   * @param repository The repository
   * @param config The approval configuration
   * @param pull_request The pull request
   * @param last_push When the pull request was last updated
   * @param frozenComments Frozen comments from database will overwrite upstream comments
   * @param token The access token to use
   * @returns {Object} Object of the shape {approvals: {total: int, groups: { groupName: int }}, vetos: int }
   */
  async fetchAndCountApprovalsAndVetos(repository, pull_request, last_push, frozenComments, config, token) {
    const user = repository.owner.login
    const upstreamComments = await this.github.getComments(user, repository.name, pull_request.number, formatDate(last_push), token)
    const comments = [...frozenComments, ...upstreamComments].filter((c, idx, array) => idx === array.findIndex(c2 => c.id === c2.id))
    return await this.countApprovalsAndVetos(repository, pull_request, comments, config.approvals, token)
  }

  /**
   * Fetches approvals for pull request and sets status on head commit.
   *
   * @param repository The repository object from GH
   * @param pull_request The pull_request object from GH
   * @param lastPush Time of last push to this PR
   * @param config The Zappr configuration
   * @param token The GH token to use
   * @param additionalComments Additional comments to consider that are not available via the API
   */
  async fetchApprovalsAndSetStatus({repository, pull_request, lastPush, config, token, additionalComments = []}) {
    const user = repository.owner.login
    const repoName = repository.name
    const sha = pull_request.head.sha
    const {approvals, vetos} = await this.fetchAndCountApprovalsAndVetos(repository, pull_request, lastPush, additionalComments, config, token)
    const status = Approval.generateStatus({approvals, vetos}, config.approvals)
    // update status
    await this.github.setCommitStatus(user, repoName, sha, status, token)
    await this.audit.log(new AuditEvent(AUDIT_EVENTS.COMMIT_STATUS_UPDATE).fromGithubEvent({
                                                                            repository,
                                                                            pull_request
                                                                          })
                                                                          .withResult({
                                                                            approvals,
                                                                            vetos,
                                                                            status
                                                                          })
                                                                          .onResource({
                                                                            commit: sha,
                                                                            issue_number: pull_request.number,
                                                                            repository
                                                                          }))
    info(`${repository.full_name}#${pull_request.number}: Set state to ${status.state} (${approvals.total.length}/${config.approvals.minimum} - ${vetos} vetos)`)
  }


  /**
   * Executes approval check.
   *
   * - PR open/reopen:
   *   1. set status to pending
   *   2. count approvals since last commit
   *   3. set status to ok when there are enough approvals
   * - IssueComment create/delete:
   *   1. verify it's on an open pull request
   *   2. set status to pending for open PR
   *   3. count approvals since last commit
   *   4. set status to ok when there are enough approvals
   * - PR synchronize (new commits on top):
   *   1. set status back to pending (b/c there can't be comments afterwards already)
   *
   * @param config The Zappr configuration (all of it)
   * @param event The GitHub event, e.g. pull_request
   * @param payload The payload of the call
   * @param token The GitHub token to use
   * @param dbRepoId The database ID of the affected repository
   */
  async execute({config, event, payload, token, dbRepoId}) {
    const {action, repository, pull_request, number, issue} = payload
    const repoName = repository.name
    const user = repository.owner.login
    const {minimum} = config.approvals
    let sha = ''
    const pendingPayload = {
      state: 'pending',
      description: 'Approval validation in progress.',
      context
    }

    debug(`${repository.full_name}: Got hook`)

    // on a closed pull request
    if (event === EVENTS.PULL_REQUEST && pull_request.state === 'closed') {
      // if it was merged
      if (pull_request.merged) {
        await this.pullRequestHandler.onDeletePullRequest(dbRepoId, number)
        await this.audit.log(new AuditEvent(AUDIT_EVENTS.PULL_REQUEST_MERGED).fromGithubEvent(payload)
                                                                             .onResource({
                                                                               repository,
                                                                               pull_request,
                                                                               issue_number: number
                                                                             })
                                                                             .byUser(pull_request.merged_by.login))
      }
      // no further processing needed
      return
    }


    try {
      // on an open pull request
      if (event === EVENTS.PULL_REQUEST && pull_request.state === 'open') {
        sha = pull_request.head.sha
        const dbPR = await this.getOrCreateDbPullRequest(dbRepoId, number)
        // if it was (re)opened
        if (action === 'opened' || action === 'reopened') {
          // set status to pending first
          await this.github.setCommitStatus(user, repoName, sha, pendingPayload, token)

          if (action === 'opened' && minimum > 0) {
            // if it was opened, set to pending
            const approvals = {total: []}
            const vetos = []
            const status = Approval.generateStatus({approvals, vetos}, config.approvals)
            await this.github.setCommitStatus(user, repoName, sha, status, token)
            await this.audit.log(new AuditEvent(AUDIT_EVENTS.COMMIT_STATUS_UPDATE).fromGithubEvent(payload)
                                                                                  .withResult({
                                                                                    approvals,
                                                                                    vetos,
                                                                                    status
                                                                                  })
                                                                                  .onResource({
                                                                                    commit: sha,
                                                                                    issue_number: number,
                                                                                    repository
                                                                                  }))
            info(`${repository.full_name}#${number}: PR was opened, set state to pending`)
            return
          }
          // get approvals for pr
          info(`${repository.full_name}#${number}: PR was reopened`)
          const frozenComments = await this.pullRequestHandler.onGetFrozenComments(dbPR.id, dbPR.last_push)
          await this.fetchApprovalsAndSetStatus({
            repository,
            pull_request,
            lastPush: dbPR.last_push,
            config,
            token,
            additionalComments: frozenComments
          })
          // if it was synced, ie a commit added to it
        } else if (action === 'synchronize') {
          // update last push in db
          await this.pullRequestHandler.onAddCommit(dbRepoId, number)
          // remove frozen comments
          await this.pullRequestHandler.onRemoveFrozenComments(dbPR.id)
          // set status to pending (has to be unlocked with further comments)
          const approvals = {total: []}
          const vetos = []
          const status = Approval.generateStatus({approvals, vetos}, config.approvals)
          await this.github.setCommitStatus(user, repoName, sha, status, token)
          await this.audit.log(new AuditEvent(AUDIT_EVENTS.COMMIT_STATUS_UPDATE).fromGithubEvent(payload)
                                                                                .withResult({
                                                                                  approvals,
                                                                                  vetos,
                                                                                  status
                                                                                })
                                                                                .onResource({
                                                                                  commit: sha,
                                                                                  issue_number: number,
                                                                                  repository
                                                                                }))
          info(`${repository.full_name}#${number}: PR was synced, set state to pending`)
        }
        // on an issue comment
      } else if (event === EVENTS.ISSUE_COMMENT) {
        // check it belongs to an open pr
        const pr = await this.github.getPullRequest(user, repoName, issue.number, token)
        if (!pr || pr.state !== 'open') {
          debug(`${repository.full_name}#${issue.number}: Ignoring comment, not a PR`)
          return
        }
        sha = pr.head.sha
        // set status to pending first
        await this.github.setCommitStatus(user, repoName, sha, pendingPayload, token)
        // read last push date from db
        const dbPR = await this.getOrCreateDbPullRequest(dbRepoId, issue.number)
        // read frozen comments and update if appropriate
        const frozenComments = await this.pullRequestHandler.onGetFrozenComments(dbPR.id, dbPR.last_push)
        const commentId = payload.comment.id
        if (['edited', 'deleted'].indexOf(action) !== -1 && frozenComments.indexOf(commentId) === -1) {
          // check if it was edited by someone else than the original author
          const editor = payload.sender.login
          const author = payload.comment.user.login
          if (editor !== author) {
            // OMFG
            const comment = toGenericComment(payload.comment)
            const frozenComment = {
              id: commentId,
              body: action === 'edited' ? payload.changes.body.from : comment.body,
              user: comment.user,
              created_at: comment.created_at
            }
            await this.pullRequestHandler.onAddFrozenComment(dbPR.id, frozenComment)
            frozenComments.push(frozenComment)
            info(`${repository.full_name}#${issue.number}: ${editor} ${action} ${author}'s comment ${commentId}, it's now frozen.`)
          }
        }
        info(`${repository.full_name}#${issue.number}: Comment added`)
        await this.fetchApprovalsAndSetStatus({
          repository,
          pull_request: pr,
          lastPush: dbPR.last_push,
          config,
          token,
          additionalComments: frozenComments
        })
      }
    }
    catch (e) {
      error(e)
      await this.github.setCommitStatus(user, repoName, sha, {
        state: 'error',
        context,
        description: e.message
      }, token)
    }
  }

}
