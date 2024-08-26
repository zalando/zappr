import Approval from './Approval'
import Autobranch from './Autobranch'
import CommitMessage from './CommitMessage'
import Specification from './Specification'
import PullRequestMilestone from './PullRequestMilestone'
import PullRequestLabels from './PullRequestLabels'
import PullRequestMergeCommit from './PullRequestMergeCommit'
import PullRequestTasks from './PullRequestTasks'
import PullRequestSize from './PullRequestSize'

const CHECKS = {
  [Approval.TYPE]: Approval,
  [Autobranch.TYPE]: Autobranch,
  [CommitMessage.TYPE]: CommitMessage,
  [Specification.TYPE]: Specification,
  [PullRequestMilestone.TYPE]: PullRequestMilestone,
  [PullRequestLabels.TYPE]: PullRequestLabels,
  [PullRequestMergeCommit.TYPE]: PullRequestMergeCommit,
  [PullRequestTasks.TYPE]: PullRequestTasks,
  [PullRequestSize.TYPE]: PullRequestSize
}

export const CHECK_NAMES = {
  [Approval.TYPE]: Approval.NAME,
  [Autobranch.TYPE]: Autobranch.NAME,
  [CommitMessage.TYPE]: CommitMessage.NAME,
  [Specification.TYPE]: Specification.NAME,
  [PullRequestMilestone.TYPE]: PullRequestMilestone.NAME,
  [PullRequestLabels.TYPE]: PullRequestLabels.NAME,
  [PullRequestMergeCommit.TYPE]: PullRequestMergeCommit.NAME,
  [PullRequestTasks.TYPE]: PullRequestTasks.NAME,
  [PullRequestSize.TYPE]: PullRequestSize.NAME
}

export const CHECK_TYPES = Object.keys(CHECKS)

export function getCheckByType(type) {
  return CHECKS[type]
}

export { Approval, Autobranch, CommitMessage, Specification, PullRequestMilestone, PullRequestLabels, PullRequestMergeCommit, PullRequestTasks, PullRequestSize }
