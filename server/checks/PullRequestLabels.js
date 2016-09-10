import Check, { getPayloadFn } from './Check'
import { PULL_REQUEST } from '../model/GithubEvents'
import { getIn, setIntersection, setDifference } from '../../common/util';
import { logger } from '../../common/debug'

const CHECK_TYPE = 'pullrequestlabels'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const debug = logger(CHECK_TYPE)
const context = 'zappr/pr/labels'
const createStatePayload = getPayloadFn(context)

export function generateStatus(labels, checkConfig) {
  const {required, verboten} = checkConfig
  const requiredSet = new Set(required)
  const verbotenSet = new Set(verboten)
  const labelSet = new Set(labels)

  const verbotenLabels = setIntersection(labelSet, verbotenSet)
  if (verbotenLabels.size > 0) {
    return createStatePayload(`PR has verboten labels: ${[...verbotenLabels].join(', ')}.`, 'failure')
  }
  const missingLabels = setDifference(requiredSet, labelSet)
  if (missingLabels.size > 0) {
    return createStatePayload(`PR misses required labels: ${[...missingLabels].join(', ')}.`, 'failure')
  }
  return createStatePayload(`PR has all required labels.`)
}

export default class PullRequestLabels extends Check {
  static TYPE = CHECK_TYPE;
  static HOOK_EVENTS = [PULL_REQUEST];
  static NAME = 'Pull request labels check';

  constructor(github) {
    super()
    this.github = github
  }

  async execute(config, hookPayload, token) {
    const {action, repository, number, pull_request} = hookPayload
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    try {
      const {required, verboten} = getIn(config, ['pull-request', 'labels'], {required: [], verboten: []})
      if (required.length === 0 && verboten.length === 0) {
        // there is nothing to check against
        info(`${fullName}#${number}: Configuration is empty, nothing to do.`)
        return
      }
      if (['labeled', 'unlabeled', 'opened', 'reopened'].indexOf(action) !== -1 && pull_request.state === 'open') {
        const labels = await this.github.getIssueLabels(repoOwner, repoName, number, token)
        const status = generateStatus(labels, {required, verboten})
        debug(`${fullName}#${number}: ${labels} (required: ${required}, verboten: ${verboten})`)
        info(`${fullName}#${number}: Set status to ${status.state}.`)
        await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
      }
    } catch(e) {
      error(`${fullName}#${number}: Could not execute Pull Request Labels check`, e)
      const status = createStatePayload(`Error: ${e.message}`, 'error')
      await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
    }
  }
}
