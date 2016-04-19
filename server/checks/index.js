import Approval from './Approval'
import Autobranch from './Autobranch'
import TicketReference from './TicketReference'

const CHECKS = {}
CHECKS[Approval.type] = Approval
CHECKS[Autobranch.type] = Autobranch
CHECKS[TicketReference.type] = TicketReference

export const TYPES = Object.keys(CHECKS)

export function getCheckByType(type) {
  return CHECKS[type]
}

export { default as Approval } from './Approval'
export { default as Autobranch } from './Autobranch'
