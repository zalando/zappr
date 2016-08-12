import { PullRequest, BlacklistedComment } from '../model'

import { logger } from '../../common/debug'
const debug = logger('pr-handler')

class PullRequestHandler {
  onCreatePullRequest(repositoryId, number) {
    debug(`create pr ${number} for repo ${repositoryId}`)
    return PullRequest.create({
      repositoryId,
      number
    })
  }

  onGet(repositoryId, number) {
    debug(`reading pr ${number} of repo ${repositoryId}`)
    return PullRequest.findOne({
      where: {repositoryId, number}
    })
  }

  onGetBlacklistedComments(pullRequestId) {
    return BlacklistedComment.pullRequestScope(pullRequestId)
  }

  onAddBlacklistedComment(repositoryId, pullRequestId, commentId) {
    return BlacklistedComment.create({ repositoryId, pullRequestId, commentId })
  }

  onAddCommit(id, number) {
    if (number) {
      const repositoryId = id
      debug(`add commit to pr ${number} of repo ${id}`)
      return PullRequest.update({
        last_push: Date.now()
      }, {
        where: {repositoryId, number}
      })
    } else {
      debug(`add commit to pr ${id}`)
      return PullRequest.update({
        last_push: Date.now()
      }, {
        where: {id}
      })
    }
  }
}

export const pullRequestHandler = new PullRequestHandler()
