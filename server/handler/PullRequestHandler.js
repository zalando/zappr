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
                             .findAll()
                             .then(comments => comments ? comments.map(({id}) => id) : [])
  }

  onAddBlacklistedComment(pullRequestId, commentId) {
    debug(`blacklist comment ${commentId} for pull request ${pullRequestId}`)
    return BlacklistedComment.create({ pullRequestId, id: commentId })
  }

  // not sure if we need this
  onRemoveBlacklistedComments(pullRequestId) {
    debug(`remove blacklisted comments ffor pull request ${pullRequestId}`)
    return BlacklistedComment.pullRequestScope(pullRequestId).delete()
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
