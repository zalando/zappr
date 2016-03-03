import { PullRequest } from '../model'

import { logger } from '../../common/debug'
const log = logger('handler')

class PullRequestHandler {
  onCreatePullRequest(repositoryId, number) {
    log(`create pr for repo ${repositoryId}`)
    return PullRequest.create({
      repositoryId,
      number
    })
  }

  onGet(repositoryId, number) {
    log(`reading pr ${number} of repo ${repositoryId}`)
    return PullRequest.findOne({
      where: {repositoryId, number}
    })
  }

  onAddCommit(id, number) {
    if (number) {
      const repositoryId = id
      log(`add commit to pr ${number} of repo ${id}`)
      return PullRequest.update({
        last_push: Date.now()
      }, {
        where: {repositoryId, number}
      })
    } else {
      log(`add commit to pr ${id}`)
      return PullRequest.update({
        last_push: Date.now()
      }, {
        where: {id}
      })
    }
  }
}

export const pullRequestHandler = new PullRequestHandler()
