import Approval from './Approval'
import Autobranch from './Autobranch'
import CommitMessage from './CommitMessage'
import Specification from './Specification'
import LinkTickets from './LinkTickets'

const CHECKS = {
  [Approval.TYPE]: Approval,
  [Autobranch.TYPE]: Autobranch,
  [CommitMessage.TYPE]: CommitMessage,
  [Specification.TYPE]: Specification,
  [LinkTickets.TYPE]: LinkTickets
}

export const CHECK_NAMES = {
  [Approval.TYPE]: Approval.NAME,
  [Autobranch.TYPE]: Autobranch.NAME,
  [CommitMessage.TYPE]: CommitMessage.NAME,
  [Specification.TYPE]: Specification.NAME,
  [LinkTickets.TYPE]: LinkTickets.NAME
}

export const CHECK_TYPES = Object.keys(CHECKS)

export function getCheckByType(type) {
  return CHECKS[type]
}

export { Approval, Autobranch, CommitMessage, Specification, LinkTickets }
