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
    return `This PR has the required ${actual}/${needed} approvals.`
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

  static async execute(github, config, hookPayload) {
    const {action, repository, pull_request, number, issue} = hookPayload
    const repo = repository.name
    const user = repository.owner.login
    const {min_approvals, approval_regex} = config.approvals
    const pendingPayload = {
      status: 'pending',
      description: 'ZAPPR validation in progress.',
      context: 'zappr'
    }
    // on an open pull request
    if (!!pull_request && pull_request.state === 'open') {
      // if it was (re)opened
      if (action === 'opened' || action === 'reopened') {
        // set status to pending first
        await github.setCommitStatus(user, repo, pull_request.head.sha, pendingPayload)
        // get approvals for pr
        let approvals = await github.getApprovals(user, repo, pull_request, approval_regex)
        let status = {
          status: approvals < min_approvals ? 'failure' : 'success',
          context: 'zappr',
          description: this.generateStatusMessage(approvals, min_approvals)
        }
        // update status
        await github.setCommitStatus(user, repo, pull_request.head.sha, status)
      // if it was synced, ie a commit added to it
      } else if (action === 'synchronize') {
        // set status to failure (has to be unlocked with further comments)
        await github.setCommitStatus(user, repo, pull_request.head.sha, {
          status: 'failure',
          description: this.generateStatusMessage(0, min_approvals),
          context: 'zappr'
        })
      }
    // on an issue comment
    } else if (!!issue) {
      // check it belongs to an open pr
      const pr = await github.getPullRequest(user, repo, issue.number)
      if (!pr || pr.state !== 'open') {
        return
      }
      // set status to pending first
      await github.setCommitStatus(user, repo, pr.head.sha, pendingPayload)
      // get approvals for pr
      let approvals = await github.getApprovals(user, repo, pr, approval_regex)
      let status = {
        status: approvals < min_approvals ? 'failure' : 'success',
        context: 'zappr',
        description: this.generateStatusMessage(approvals, min_approvals)
      }
      // update status
      await github.setCommitStatus(user, repo, pr.head.sha, status)
    }
  }
}
