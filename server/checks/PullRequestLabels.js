import Check, { getPayloadFn } from './Check'
import { PULL_REQUEST } from '../model/GithubEvents'
import { getIn, setDifference } from '../../common/util';
import { logger } from '../../common/debug'

const CHECK_TYPE = 'pullrequestlabels'
const CONTEXT = 'zappr/pr/labels'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const debug = logger(CHECK_TYPE)
const createStatePayload = getPayloadFn(CONTEXT)

export function generateStatus(labels, checkConfig) {
  const {required, additional} = checkConfig
  const requiredSet = new Set(required)
  const labelSet = new Set(labels)

  const missingLabels = setDifference(requiredSet, labelSet)
  if (missingLabels.size > 0) {
    return createStatePayload(`PR misses required labels: ${[...missingLabels].join(', ')}.`, 'failure')
  }
  if (additional) {
    // if additional labels are allowed, we don't care about them
    return createStatePayload(`PR has all required labels.`)
  } else {
    const redundantLabels = setDifference(labelSet, requiredSet)
    return redundantLabels.size === 0 ?
      createStatePayload(`PR has all required labels.`) :
      createStatePayload(`PR has redundant labels: ${[...redundantLabels].join(', ')}.`, 'failure')
  }
}

export default class PullRequestLabels extends Check {
  static TYPE = CHECK_TYPE;
  static CONTEXT = CONTEXT;
  static HOOK_EVENTS = [PULL_REQUEST];
  static NAME = 'Pull request labels check';

  constructor(github) {
    super()
    this.github = github
  }

  async fetchLabelsAndSetStatus({repository, pull_request, token, config}) {
    const required = getIn(config, ['pull-request', 'labels', 'required'], [])
    const additional = getIn(config, ['pull-request', 'labels', 'additional'], true)
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    const number = pull_request.number

    let status = createStatePayload('No required labels are configured.')
    if (required.length > 0) {
      const labels = await this.github.getIssueLabels(repoOwner, repoName, number, token)
      status = generateStatus(labels, {required, additional})
    }
    await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
    info(`${fullName}#${number}: Set status to ${status.state}.`)
  }

  async execute(config, hookPayload, token) {
    const {action, repository, number, pull_request} = hookPayload
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    try {
      if (['labeled', 'unlabeled', 'opened', 'reopened', 'synchronize'].indexOf(action) !== -1 && pull_request.state === 'open') {
        await this.fetchLabelsAndSetStatus({repository, pull_request, token, config})
      }
    } catch (e) {
      error(`${fullName}#${number}: Could not execute Pull Request Labels check`, e)
      const status = createStatePayload(`Error: ${e.message}`, 'error')
      await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
    }
  }
}
