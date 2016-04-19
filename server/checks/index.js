import Approval from './Approval'
import Autobranch from './Autobranch'
import TicketReference from './TicketReference'

const CHECKS = {
  [Approval.TYPE]: Approval,
  [Autobranch.TYPE]: Autobranch
}

export const CHECK_NAMES = {
  [Approval.TYPE]: Approval.NAME,
  [Autobranch.TYPE]: Autobranch.NAME
}
>>>>>>> master

export const CHECK_TYPES = Object.keys(CHECKS)

export function getCheckByType(type) {
  return CHECKS[type]
}

export { default as Approval } from './Approval'
export { default as Autobranch } from './Autobranch'
