import Check, { getPayloadFn } from './Check'
import { getIn, setDifference } from '../../common/util';
import { logger } from '../../common/debug'
import * as EVENTS from '../model/GithubEvents'

const CHECK_TYPE = 'pullrequestmilestone'
const CONTEXT = 'zappr/pr/milestone'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const debug = logger(CHECK_TYPE)
const createStatePayload = getPayloadFn(CONTEXT)

export function generateStatus(milestone) {
  if (milestone !== null) {
    return createStatePayload(`PR has a milestone set.`);
  } else {
    return createStatePayload(`PR has no milestone set.`, 'failure');
  }
}

export default class PullRequestMilestone extends Check {
  static TYPE = CHECK_TYPE;
  static CONTEXT = CONTEXT;
  static HOOK_EVENTS = [EVENTS.ISSUE_COMMENT, EVENTS.PULL_REQUEST];
  static NAME = 'Pull request milestone check';

  constructor(github) {
    super()
    this.github = github
  }

  async fetchMilestoneAndSetStatus({repository, pull_request, token}) {
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    const number = pull_request.number

    const milestone = await this.github.getIssueMilestone(repoOwner, repoName, number, token)
    let status = generateStatus(milestone)
    info(`${fullName}#${number}: Set status to ${status.state} (milestone: ${milestone})`)
    await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
  }

  async execute(config, hookPayload, token) {
    const {action, repository, number, pull_request} = hookPayload
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    try {
      if (['milestoned', 'demilestoned', 'opened', 'reopened'].indexOf(action) !== -1 && pull_request.state === 'open') {
        await this.fetchMilestoneAndSetStatus({repository, pull_request, token})
      }
    } catch (e) {
      error(`${fullName}#${number}: Could not execute Pull Request Milestone check`, e)
      const status = createStatePayload(`Error: ${e.message}`, 'error')
      await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
    }
  }
}
