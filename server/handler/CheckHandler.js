import { Check } from "../model"
import { logger } from "../../common/debug"

const debug = logger('check-handler')

class CheckHandler {
  onCreateCheck(repoId, type, token) {
    debug(`create check ${type} for repo ${repoId} w/ token ${token ? token.substr(0, 4) : 'NONE'}`)
    return Check.create({
      repositoryId: repoId,
      type,
      token,
      arguments: {}
    }, {
      attributes: {exclude: ['token']}
    })
  }

  onRefreshTokens(repoIds, token) {
    // noop for now
    // implement this when we fucked up
    return Promise.resolve()
  }

  onGetOne(repoId, type) {
    debug(`find check ${type} for repo ${repoId}`)
    return Check.findOne({
      where: {
        repositoryId: repoId,
        type
      }
    })
  }

  onDeleteCheck(repoId, type) {
    debug(`delete check ${type} for repo ${repoId}`)
    return Check.destroy({
      where: {
        repositoryId: repoId,
        type
      }
    })
  }
}

export const checkHandler = new CheckHandler()
