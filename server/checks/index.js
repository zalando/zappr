import Approval from './Approval'
import Autobranch from './Autobranch'

const CHECKS = {}
CHECKS[Approval.type] = Approval
CHECKS[Autobranch.type] = Autobranch

export const TYPES = Object.keys(CHECKS)

export function getCheckByType(type) {
  return CHECKS[type]
}

export { default as Approval } from './Approval'
export { default as Autobranch } from './Autobranch'
