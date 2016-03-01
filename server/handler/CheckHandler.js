import Approval from '../checks/Approval'
import { Check } from '../model'

import { logger } from '../../common/debug'
const log = logger('handler')

class CheckHandler {
  onCreateCheck(repoId, type) {
    log(`create check ${type} for repo ${repoId}`)
    return Check.create({
      repositoryId: repoId,
      type,
      arguments: {}
    })
  }

  onDeleteChecks(repoId) {
    log(`delete all checks for repo ${repoId}`)
    return Check.destroy({
      where: {
        repositoryId: repoId
      }
    })
  }

  onDeleteCheck(repoId, type) {
    log(`delete check ${type} for repo ${repoId}`)
    return Check.destroy({
      where: {
        repositoryId: repoId,
        type
      }
    })
  }
}

export const checkHandler = new CheckHandler()
