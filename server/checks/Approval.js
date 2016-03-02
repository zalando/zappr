import { logger } from '../../common/debug'
const log = logger('approval')

export default class Approval {
  static get type() {
    return 'approval'
  }

  static get hookEvents() {
    return ['pull_request', 'issue_comment']
  }

  static generateStatusMessage(actual, needed) {
    if (actual < needed) {
      return `This PR needs ${needed - actual} more approvals (${actual}/${needed} given).`
    }
    return `This PR has ${actual}/${needed} approvals since the last commit.`
  }

  /**
   * - PR open/reopen:
   *   1. set status to pending
   *   2. count approvals since last commit
   *   3. set status to ok or fail
   * - IssueComment create/delete:
   *   1. verify it's on an open pull request
   *   2. set status to pending for open PR
   *   3. count approvals since last commit
   *   4. set status to ok or fail
   * - PR synchronize:
   *   1. set status to fail (b/c there can't be comments afterwards already)
   */

  static async execute(github, config, hookPayload, token, dbRepoId, pullRequestHandler) {
    const {action, repository, pull_request, number, issue} = hookPayload
    const repo = repository.name
    const user = repository.owner.login
    const {minimum, pattern} = config.approvals
    const pendingPayload = {
      state: 'pending',
      description: 'ZAPPR validation in progress.',
      context: 'zappr'
    }
    // on an open pull request
    if (!!pull_request && pull_request.state === 'open') {
      // if it was (re)opened
      if (action === 'opened' || action === 'reopened') {
        // set status to pending first
        await github.setCommitStatus(user, repo, pull_request.head.sha, pendingPayload, token)
        if (action === 'opened') {
          try {
            await pullRequestHandler.onCreatePullRequest(dbRepoId, number)
          } catch(e) {
            console.log(e)
          }
        }
        // get approvals for pr
        let approvals = await github.getApprovals(user, repo, pull_request, pattern, token)
        let status = {
          state: approvals < minimum ? 'failure' : 'success',
          context: 'zappr',
          description: this.generateStatusMessage(approvals, minimum)
        }
        // update status
        await github.setCommitStatus(user, repo, pull_request.head.sha, status, token)
      // if it was synced, ie a commit added to it
      } else if (action === 'synchronize') {
        // update db pr
        await pullRequestHandler.onAddCommit(dbRepoId, number)
        // set status to failure (has to be unlocked with further comments)
        await github.setCommitStatus(user, repo, pull_request.head.sha, {
          state: 'failure',
          description: this.generateStatusMessage(0, minimum),
          context: 'zappr'
        }, token)
      }
    // on an issue comment
    } else if (!!issue) {
      // check it belongs to an open pr
      const pr = await github.getPullRequest(user, repo, issue.number, token)
      if (!pr || pr.state !== 'open') {
        return
      }
      // set status to pending first
      await github.setCommitStatus(user, repo, pr.head.sha, pendingPayload, token)
      // get approvals for pr
      const dbPR = await pullRequestHandler.onGet(dbRepoId, issue.number)
      pr.updated_at = github.formatDate(dbPR.last_push)
      let approvals = await github.getApprovals(user, repo, pr, pattern, token)
      let status = {
        state: approvals < minimum ? 'failure' : 'success',
        context: 'zappr',
        description: this.generateStatusMessage(approvals, minimum)
      }
      // update status
      await github.setCommitStatus(user, repo, pr.head.sha, status, token)
    }
  }
}
