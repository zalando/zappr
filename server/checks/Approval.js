import Check from './Check'
import { logger, formatDate } from '../../common/debug'
import { promiseReduce } from '../../common/util'
import * as EVENTS from '../model/GithubEvents'

const context = 'zappr'
const info = logger('approval', 'info')
const debug = logger('approval')
const error = logger('approval', 'error')

export default class Approval extends Check {

  static TYPE = 'approval'
  static NAME = 'Approval check'
  static HOOK_EVENTS = [EVENTS.PULL_REQUEST, EVENTS.ISSUE_COMMENT]

  static generateStatus(approvals, {minimum, groups}) {
    if (Object.keys(approvals.groups || {}).length > 0) {
      // check group requirements
      const unsatisfied = Object.keys(approvals.groups)
                                .map(approvalGroup => {
                                  const needed = groups[approvalGroup].minimum
                                  const given = approvals.groups[approvalGroup]
                                  const diff = needed - given
                                  if (diff > 0) {
                                    return {approvalGroup, diff, needed, given}
                                  } else {
                                    return false
                                  }
                                })
                                .filter(diff => !!diff)

      if (unsatisfied.length > 0) {
        const firstUnsatisfied = unsatisfied[0]
        return {
          description: `This PR misses ${firstUnsatisfied.diff} approvals from group ${firstUnsatisfied.approvalGroup} (${firstUnsatisfied.given}/${firstUnsatisfied.needed}).`,
          state: 'pending',
          context
        }
      }
    }

    if (approvals.total < minimum) {
      return {
        description: `This PR needs ${minimum - approvals.total} more approvals (${approvals.total}/${minimum} given).`,
        state: 'pending',
        context
      }
    }

    return {
      description: `This PR has ${approvals.total}/${minimum} approvals since the last commit.`,
      state: 'success',
      context
    }
  }

  /**
   * Returns the comment if it matches the config, null otherwise.
   */
  static async doesCommentMatchConfig(github, repository, comment, fromConfig, token) {
    // persons must either be listed explicitly in users OR
    // be a collaborator OR
    // member of at least one of listed orgs
    const {orgs, collaborators, users} = fromConfig
    const username = comment.user.login
    const {full_name} = repository
    // first do the quick username check
    if (users && users.indexOf(username) >= 0) {
      debug(`${full_name}: ${username} is listed explicitly`)
      return comment
    }
    // now collaborators
    if (collaborators) {
      const isCollaborator = await github.isCollaborator(repository.owner.login, repository.name, username, token)
      if (isCollaborator) {
        debug(`${full_name}: ${username} is collaborator`)
        return comment
      }
    }
    // and orgs
    if (orgs) {
      const orgMember = await Promise.all(orgs.map(o => github.isMemberOfOrg(o, username, token)))
      if (orgMember.indexOf(true) >= 0) {
        debug(`${full_name}: ${username} is org member`)
        return comment
      }
    }
    debug(`${full_name}: ${username}'s approval does not count`)
    // okay, no member of anything
    return null
  }

  static async getApprovalsForConfig(github, repository, comments, config, token) {
    const that = this

    async function checkComment(stats, comment) {
      let matchesTotal = false
      if (config.from) {
        matchesTotal = await that.doesCommentMatchConfig(github, repository, comment, config.from, token)
        if (matchesTotal) {
          info(`${repository.full_name}: Counting ${comment.user.login}'s approval`)
          stats.total += 1
        }
      } else {
        // if there is no from clause, every approval counts
        stats.total += 1
        matchesTotal = true
      }
      if (config.groups) {
        await Promise.all(Object.keys(config.groups).map(async(group) => {
          // update group counter
          if (!stats.groups[group]) {
            stats.groups[group] = 0
          }
          const matchesGroup = await that.doesCommentMatchConfig(github, repository, comment, config.groups[group].from, token)
          if (matchesGroup) {
            // counting this as total as well if it didn't before
            if (!matchesTotal) {
              info(`${repository.full_name}: Counting ${comment.user.login}'s approval`)
              stats.total += 1
            }
            info(`${repository.full_name}: Counting ${comment.user.login}'s for group ${group}`)
            stats.groups[group] += 1
          }
        }))
      }
      return stats
    }

    return promiseReduce(comments, checkComment, {total: 0, groups: {}})
  }

  static async countApprovals(github, repository, comments, config, token) {
    const {pattern, ignore} = config
    const fullName = `${repository.full_name}`
    // filter ignored users
    let filtered = comments.filter(comment => {
                             const {login} = comment.user
                             const include = (ignore || []).indexOf(login) === -1
                             if (!include) info('%s: Ignoring user: %s.', fullName, login)
                             return include
                           })
                           // get comments that match specified approval pattern
                           // TODO add unicode flag once available in node
                           .filter(comment => {
                             const text = comment.body.trim()
                             const include = (new RegExp(pattern)).test(text)
                             if (!include) info('%s: Comment "%s" does not match pattern "%s".', fullName, text, pattern)
                             return include
                           })
                           // slightly unperformant filtering here:
                           // kicking out multiple approvals from same person
                           .filter((c1, i, cmts) => i === cmts.findIndex(c2 => c1.user.login === c2.user.login))
    // don't proceed if nothing is left
    if (filtered.length === 0) {
      return {total: 0}
    }
    // we now have approvals from a set of persons
    // check membership requirements
    if (config.from || config.groups) {
      // check if any comments match those configs
      return await this.getApprovalsForConfig(github, repository, filtered, config, token)
    } else {
      return {total: filtered.length}
    }
  }

  static async fetchAndCountApprovals(github, repository, config, dbPR, number, token) {
    const repoName = repository.name
    const user = repository.owner.login
    // get approval count
    const commits = await github.fetchPullRequestCommits(user, repoName, number, token)
    const lastCommitter = commits.length === 0 ?
      null :
      commits[commits.length - 1].committer.login
    const countConfig = Object.assign({}, config.approvals, {ignore: lastCommitter ? [lastCommitter] : []})
    const comments = await github.getComments(user, repoName, number, formatDate(dbPR.last_push), token)
    return await this.countApprovals(github, repository, comments, countConfig, token)
  }

  /**
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
   */
  static async execute(github, config, hookPayload, token, dbRepoId, pullRequestHandler) {
    const {action, repository, pull_request, number, issue} = hookPayload
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

    try {
      // on an open pull request
      if (!!pull_request && pull_request.state === 'open') {
        sha = pull_request.head.sha
        // if it was (re)opened
        if (action === 'opened' || action === 'reopened') {
          // set status to pending first
          await github.setCommitStatus(user, repoName, sha, pendingPayload, token)

          const dbPR = await this.getOrCreateDbPullRequest(pullRequestHandler, dbRepoId, number)

          if (action === 'opened' && minimum > 0) {
            // if it was opened, set to pending
            await github.setCommitStatus(user, repoName, sha, this.generateStatus({total: 0}, config.approvals), token)
            info(`${repository.full_name}#${number}: PR was opened, set state to pending`)
            return
          }
          // get approvals for pr
          const approvals = await this.fetchAndCountApprovals(github, repository, config, dbPR, number, token)
          const status = this.generateStatus(approvals, config.approvals)
          // update status
          await github.setCommitStatus(user, repoName, sha, status, token)
          info(`${repository.full_name}#${number}: PR was reopened, set state to ${status.state} (${approvals}/${minimum})`)
          // if it was synced, ie a commit added to it
        } else if (action === 'synchronize') {
          // update last push in db
          await pullRequestHandler.onAddCommit(dbRepoId, number)
          // set status to pending (has to be unlocked with further comments)
          await github.setCommitStatus(user, repoName, sha, this.generateStatus({total: 0}, config.approvals), token)
          info(`${repository.full_name}#${number}: PR was synced, set state to pending`)
        }
        // on an issue comment
      } else if (!!issue) {
        // check it belongs to an open pr
        const pr = await github.getPullRequest(user, repoName, issue.number, token)
        if (!pr || pr.state !== 'open') {
          debug(`${repository.full_name}#${issue.number}: Ignoring comment, not a PR`)
          return
        }
        sha = pr.head.sha
        // set status to pending first
        await github.setCommitStatus(user, repoName, sha, pendingPayload, token)
        // read last push date from db
        const dbPR = await this.getOrCreateDbPullRequest(pullRequestHandler, dbRepoId, issue.number)
        const approvals = await this.fetchAndCountApprovals(github, repository, config, dbPR, issue.number, token)
        const status = this.generateStatus(approvals, config.approvals)
        // update status
        await github.setCommitStatus(user, repoName, sha, status, token)
        info(`${repository.full_name}#${issue.number}: Comment added, set state to ${status.state} (${approvals.total}/${minimum})`)
      }
    }
    catch (e) {
      error(e)
      await github.setCommitStatus(user, repoName, sha, {
        state: 'error',
        context,
        description: e.message
      }, token)
    }
  }

  static async getOrCreateDbPullRequest(pullRequestHandler, dbRepoId, number) {
    let dbPR = await pullRequestHandler.onGet(dbRepoId, number)
    if (!dbPR) {
      dbPR = await pullRequestHandler.onCreatePullRequest(dbRepoId, number)
    }
    return dbPR;
  }
}
