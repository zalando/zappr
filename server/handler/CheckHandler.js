import Approval from '../checks/Approval'
import { Check } from '../model'

import { logger } from '../../common/debug'
const log = logger('handler')

class CheckHandler {
  onCreateApprovalCheck(repoId) {
    log(`create approval check for repo ${repoId}`)
    return Check.create({
      repositoryId: repoId,
      type: Approval.type,
      arguments: {}
    })
  }

  onDeleteApprovalCheck(repoId) {
    log(`delete approval checks for repo ${repoId}`)
    return Check.destroy({
      where: {
        repositoryId: repoId,
        type: Approval.type
      }
    })
  }
}

export const checkHandler = new CheckHandler()
