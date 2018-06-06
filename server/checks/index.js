import Approval from './Approval'
import Autobranch from './Autobranch'
import CommitMessage from './CommitMessage'
import Specification from './Specification'
import PullRequestMilestone from './PullRequestMilestone'
import PullRequestLabels from './PullRequestLabels'
import PullRequestTasks from './PullRequestTasks'

const CHECKS = {
  [Approval.TYPE]: Approval,
  [Autobranch.TYPE]: Autobranch,
  [CommitMessage.TYPE]: CommitMessage,
  [Specification.TYPE]: Specification,
  [PullRequestMilestone.TYPE]: PullRequestMilestone,
  [PullRequestLabels.TYPE]: PullRequestLabels,
  [PullRequestTasks.TYPE]: PullRequestTasks
}

export const CHECK_NAMES = {
  [Approval.TYPE]: Approval.NAME,
  [Autobranch.TYPE]: Autobranch.NAME,
  [CommitMessage.TYPE]: CommitMessage.NAME,
  [Specification.TYPE]: Specification.NAME,
  [PullRequestMilestone.TYPE]: PullRequestMilestone.NAME,
  [PullRequestLabels.TYPE]: PullRequestLabels.NAME,
  [PullRequestTasks.TYPE]: PullRequestTasks.NAME
}

export const CHECK_TYPES = Object.keys(CHECKS)

export function getCheckByType(type) {
  return CHECKS[type]
}

export { Approval, Autobranch, CommitMessage, Specification, PullRequestMilestone, PullRequestLabels, PullRequestTasks }
