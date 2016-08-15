import { PullRequest, FrozenComment } from '../model'

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

  onGetFrozenComments(pullRequestId, createdSince) {
    return FrozenComment.pullRequestScope(pullRequestId)
                        .findAll({
                          where: {
                            created_at: {
                              $gte: createdSince
                            }
                          }
                        })
                        .then(comments => comments || [])
  }

  onAddFrozenComment(pullRequestId, {id, body, created_at, user}) {
    debug(`freeze comment ${id} for pull request ${pullRequestId}`)
    return FrozenComment.create({pullRequestId, id, body, created_at, user})
  }

  // not sure if we need this
  onRemoveFrozenComments(pullRequestId) {
    debug(`remove frozen comments for pull request ${pullRequestId}`)
    return FrozenComment.pullRequestScope(pullRequestId).delete()
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
