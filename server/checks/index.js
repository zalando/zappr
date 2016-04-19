import Approval from './Approval'
import Autobranch from './Autobranch'
import CommitMessage from './CommitMessage'

const CHECKS = {
  [Approval.TYPE]: Approval,
  [Autobranch.TYPE]: Autobranch,
  [CommitMessage.TYPE]: CommitMessage
}

export const CHECK_NAMES = {
  [Approval.TYPE]: Approval.NAME,
  [Autobranch.TYPE]: Autobranch.NAME,
  [CommitMessage.TYPE]: CommitMessage.NAME
}

export const CHECK_TYPES = Object.keys(CHECKS)

export function getCheckByType(type) {
  return CHECKS[type]
}

export { default as Approval } from './Approval'
export { default as Autobranch } from './Autobranch'
export { default as CommitMessage } from './CommitMessage'