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

  static generateStatus(approvals, {from, groups}) {
    // check group requirements
    const unsatisfied = approvals.groups.find(approvalGroup => {
      const needed = groups[approvalGroup].minimum
      const given = approvals.groups[approvalGroup]
      const diff = needed - given
      if (diff > 0) {
        return {approvalGroup, diff, needed, given}
      } else {
        return false
      }
    })

    if (unsatisfied) {
      return {
        description: `This PR misses ${unsatisfied.diff} approvals from group ${unsatisfied.approvalGroup} (${unsatisfied.given}/${unsatisfied.needed}).`,
        status: 'pending',
        context
      }
    }

    if (approvals.total < from.minimum) {
      return {
        description: `This PR needs ${from.minimum - approvals.total} more approvals (${approvals.total}/${from.minimum} given).`,
        status: 'pending',
        context
      }
    }

    return {
      description: `This PR has ${approvals.total}/${from.minimum} approvals since the last commit.`,
      status: 'success',
      context
    }
  }

  /**
   * Returns the comment if it matches the config, null otherwise.
   */
  static async doesCommentMatchConfig(github, repository, comment, {orgs, collaborators, users}, token) {
    // persons must either be listed explicitly in users OR
    // be a collaborator OR
    // member of at least one of listed orgs
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
    async function checkComment(stats, comment) {
      const matchesTotal = await this.doesCommentMatchConfig(github, repository, comment, config.from, token)
      if (matchesTotal) {
        info(`${repository.full_name}: Counting ${comment.user.login}'s approval`)
        stats.total += 1
      }
      await Promise.all(config.groups.map(async(group) => {
        const matchesGroup = await this.doesCommentMatchConfig(github, repository, comment, config.groups[group], token)
        if (matchesGroup) {
          // counting this as total as well if it didn't before
          if (!matchesTotal) {
            info(`${repository.full_name}: Counting ${comment.user.login}'s approval`)
            stats.total += 1
          }
          // update group counter
          if (!stats.groups[group]) {
            stats.groups[group] = 0
          }
          info(`${repository.full_name}: Counting ${comment.user.login}'s for group ${group}`)
          stats.groups[group] += 1
        }
      }))
      return stats
    }

    return promiseReduce(comments, checkComment, {total: 0, groups: {}})
  }

  static async countApprovals(github, repository, comments, config, token) {
    const {pattern, ignore} = config
    let filtered = comments
    // filter ignored users
    .filter(comment => {
      const {login} = comment.user
      const include = (ignore || []).indexOf(login) === -1
      if (!include) info('%s: Ignoring user: %s.', repository.full_name, login)
      return include
    })
    // get comments that match specified approval pattern
    // TODO add unicode flag once available in node
    .filter(comment => {
      const text = comment.body.trim()
      const include = (new RegExp(pattern)).test(text)
      if (!include) info('%s: Comment "%s" does not match pattern "%s".', repository.full_name, text, pattern)
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
    const repo = repository.name
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
        // if it was (re)opened
        if (action === 'opened' || action === 'reopened') {
          // set status to pending first
          sha = pull_request.head.sha
          await github.setCommitStatus(user, repo, pull_request.head.sha, pendingPayload, token)
          // check if we have PR already and create if we don't
          let dbPR = await pullRequestHandler.onGet(dbRepoId, number)
          if (!dbPR) {
            dbPR = await pullRequestHandler.onCreatePullRequest(dbRepoId, number)
          }
          if (action === 'opened' && minimum > 0) {
            // if it was opened, set to pending
            await github.setCommitStatus(user, repo, pull_request.head.sha, this.generateStatus({total: 0}, config.approvals), token)
            info(`${repository.full_name}#${number}: PR was opened, set state to pending`)
            return
          }
          // get approvals for pr
          const opener = pull_request.user.login
          const comments = await github.getComments(user, repo, number, formatDate(dbPR.last_push), token)
          const countConfig = Object.assign({}, config.approvals, {ignore: [opener]})
          const approvals = await this.countApprovals(github, repository, comments, countConfig, token)
          const status = this.generateStatus(approvals, config.approvals)
          // update status
          await github.setCommitStatus(user, repo, pull_request.head.sha, status, token)
          info(`${repository.full_name}#${number}: PR was reopened, set state to ${status.state} (${approvals}/${minimum})`)
          // if it was synced, ie a commit added to it
        } else if (action === 'synchronize') {
          // update last push in db
          await pullRequestHandler.onAddCommit(dbRepoId, number)
          // set status to pending (has to be unlocked with further comments)
          await github.setCommitStatus(user, repo, pull_request.head.sha, this.generateStatus({total: 0}, config.approvals), token)
          info(`${repository.full_name}#${number}: PR was synced, set state to pending`)
        }
        // on an issue comment
      } else if (!!issue) {
        // check it belongs to an open pr
        const pr = await github.getPullRequest(user, repo, issue.number, token)
        if (!pr || pr.state !== 'open') {
          debug(`${repository.full_name}#${issue.number}: Ignoring comment, not a PR`)
          return
        }
        sha = pr.head.sha
        // set status to pending first
        await github.setCommitStatus(user, repo, pr.head.sha, pendingPayload, token)
        // read last push date from db
        let dbPR = await pullRequestHandler.onGet(dbRepoId, issue.number)
        if (!dbPR) {
          dbPR = await pullRequestHandler.onCreatePullRequest(dbRepoId, issue.number)
        }
        // get approval count
        const opener = pr.user.login
        const countConfig = Object.assign({}, config.approvals, {ignore: [opener]})
        const comments = await github.getComments(user, repo, issue.number, formatDate(dbPR.last_push), token)
        const approvals = await this.countApprovals(github, repository, comments, countConfig, token)
        const status = this.generateStatus(approvals, config.approvals)
        // update status
        await github.setCommitStatus(user, repo, pr.head.sha, status, token)
        info(`${repository.full_name}#${issue.number}: Comment added, set state to ${status.state} (${approvals}/${minimum})`)
      }
    }
    catch (e) {
      error(e)
      await github.setCommitStatus(user, repo, sha, {
        state: 'error',
        context,
        description: e.message
      }, token)

    }
  }
}
