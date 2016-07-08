import Check from './Check'
import { logger } from '../../common/debug'
import * as EVENTS from '../model/GithubEvents'

const CHECK_TYPE = 'specification'
const ACTIONS = ['opened', 'edited', 'reopened', 'synchronize']

const DEFAULT_REQUIRED_LENGTH = 8
const ISSUE_PATTERN = /^(?:[-\w]+\/[-\w]+)?#\d+$/
// Grubber's pattern
const URL_PATTERN = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i

const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')

const status = (description, state = 'success') => ({
  description,
  state,
  context: 'zappr/pr/specification'
})

const isLongEnough = (str, requiredLength) => (str || '').length > requiredLength
const containsPattern = pattern => str => (str || '').split(' ')
  .some(s => pattern.test(s))
const containsUrl = containsPattern(URL_PATTERN)
const containsIssueNumber = containsPattern(ISSUE_PATTERN)

export default class Specification extends Check {
  static TYPE = CHECK_TYPE
  static NAME = 'Specification check'
  static HOOK_EVENTS = [EVENTS.PULL_REQUEST]

  /**
   * @param {GithubService} github
   */
  constructor(github) {
    super()
    this.github = github
  }

  async execute(config, hookPayload, token) {
    const { action, pull_request: pr, repository: repo } = hookPayload

    if (ACTIONS.indexOf(action) === -1 || !pr || 'open' !== pr.state) {
      info(`${repo.full_name}#${pr.number}: Nothing to do, action was "${action}" with state "${pr.state}".`)
      return
    }

    await this.validate(config, pr, repo, token)
  }

  /**
   * Should do next validation steps:
   *  * check if title's length is more than required length
   *  * check if body has one of the following (in order):
   *    * at least one issue number
   *    * at least one link
   *    * it's length is more than required length
   *
   * @param config config object
   * @param pr Github's PR object
   * @param repo Github's repository object
   * @param token access token
   */
  async validate(config, pr, repo, token) {
    const { title = '', body = '', head: { sha } } = pr
    const { owner: { login: user } } = repo
    const { specification: {
      title: {
        length: requiredTitleLength = DEFAULT_REQUIRED_LENGTH
      } = {},
      body: {
        length: requiredBodyLength = DEFAULT_REQUIRED_LENGTH,
        verify: {
          'contains-url': shouldCheckUrl = true,
          'contains-issue-number': shouldCheckIssue = true
        } = {}
      } = {}
    } = {}} = config

    if (!isLongEnough(title, requiredTitleLength)) {
      await this.github.setCommitStatus(user, repo.name, sha, status(
        `PR's title is too short (${title.length}/${requiredTitleLength})`, 'failure'
      ), token)
      info(`${repo.full_name}#${pr.number}: Set status to failure: title is ` +
        `too short (${title.length}/${requiredTitleLength})`)
      return
    }

    if (!(
      (shouldCheckIssue && containsIssueNumber(body)) ||
      (shouldCheckUrl && containsUrl(body)) ||
      isLongEnough(body, requiredBodyLength)
    )) {
      await this.github.setCommitStatus(user, repo.name, sha, status(
        `PR's body is too short (${body.length}/${requiredBodyLength})`, 'failure'
      ), token)
      info(`${repo.full_name}#${pr.number}: Set status to failure: body is ` +
        `too short (${body.length}/${requiredBodyLength})`)
      return
    }

    await this.github.setCommitStatus(user, repo.name, sha,
      status('PR has passed specification checks'), token)
    info(`${repo.full_name}#${pr.number}: Set status to success`)
  }
}

