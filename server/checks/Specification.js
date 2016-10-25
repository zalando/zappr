import Check from './Check'
import { logger } from '../../common/debug'
import * as EVENTS from '../model/GithubEvents'

const CHECK_TYPE = 'specification'
const CONTEXT = 'zappr/pr/specification'
const ACTIONS = ['opened', 'edited', 'reopened', 'synchronize']

const DEFAULT_REQUIRED_LENGTH = 8
const ISSUE_PATTERN = /^(?:[-\w]+\/[-\w]+)?#\d+$/
// Grubber's pattern
const URL_PATTERN = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i
const [MINIMUM_LENGTH, CONTAINS_URL, CONTAINS_ISSUE_NUMBER, TEMPLATE_DIFFERS_FROM_BODY] =
  ['minimum-length', 'contains-url', 'contains-issue-number',
    'differs-from-body']

const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')

const status = (description, state = 'success') => ({
  description,
  state,
  context: CONTEXT
})

const isLongEnough = (str, requiredLength) => (str || '').length > requiredLength
const containsPattern = pattern => str => (str || '').split(' ')
                                                     .some(s => pattern.test(s))
const containsUrl = containsPattern(URL_PATTERN)
const containsIssueNumber = containsPattern(ISSUE_PATTERN)

export default class Specification extends Check {
  static TYPE = CHECK_TYPE
  static CONTEXT = CONTEXT
  static NAME = 'Specification check'
  static HOOK_EVENTS = [EVENTS.PULL_REQUEST]

  /**
   * @param {GithubService} github
   */
  constructor(github) {
    super()
    this.github = github
  }

  async execute(config, payload, token) {
    const {action, pull_request: pr, repository: repo} = payload

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
    const {title = '', body = '', head: {sha}} = pr
    const {owner: {login: user}} = repo
    const {
      specification: {
        title: titleChecks = {},
        body: bodyChecks = {},
        template: templateChecks = {}
      } = {}
    } = config

    try {
      await Promise.all([
        this._validateTitle(title, titleChecks),
        this._validateTemplate(body, user, repo.name, token, templateChecks),
        this._validateBody(body, bodyChecks)
      ])
      info(`${repo.full_name}#${pr.number}: Set status to success`)
      return this.github.setCommitStatus(user, repo.name, sha,
        status('PR has passed specification checks'), token)
    } catch (e) {
      info(`${repo.full_name}#${pr.number}: Set status to failure: ${e.message}`)
      return this.github.setCommitStatus(user, repo.name, sha, status(
        e.message, 'failure'), token)
    }
  }

  /**
   *
   * @param {string} title to be validated
   * @param {Object} checks part of `specification` that contains title's checks
   */
  _validateTitle(title, checks = {}) {
    const {
      [MINIMUM_LENGTH]: {
        enabled: shouldCheckLength = true,
        length: requiredLength = DEFAULT_REQUIRED_LENGTH
      } = {}
    } = checks

    if (shouldCheckLength && !isLongEnough(title, requiredLength)) {
      throw new Error(`PR's title is too short (${title.length}/${requiredLength})`)
    }
  }

  async _validateTemplate(body, user, repo, token, checks = {}) {
    const shouldCheckWasAdjusted = checks[TEMPLATE_DIFFERS_FROM_BODY]
    if (!shouldCheckWasAdjusted) {
      return
    }
    let template
    try {
      template = await this.github.readPullRequestTemplate(user, repo, token)
    } catch (e) {
      info(`${user}/${repo}: No PULL_REQUEST_TEMPLATE found`)
      return
    }
    if (template.trim() === body.trim()) {
      throw new Error(`PR's body is the same as template`)
    }
  }

  /**
   * @param {string} body to be validated
   * @param {Object} checks part of `specification` that contains body's checks
   */
  _validateBody(body, checks = {}) {
    const {
      [MINIMUM_LENGTH]: {
        enabled: shouldCheckLength = true,
        length: requiredLength = DEFAULT_REQUIRED_LENGTH
      } = {},
      [CONTAINS_URL]: shouldCheckUrl = true,
      [CONTAINS_ISSUE_NUMBER]: shouldCheckIssue = true
    } = checks

    const checksMapping = {
      [CONTAINS_URL]: {
        enabled: shouldCheckUrl,
        fn: containsUrl.bind(null, body)
      },
      [CONTAINS_ISSUE_NUMBER]: {
        enabled: shouldCheckIssue,
        fn: containsIssueNumber.bind(null, body)
      },
      [MINIMUM_LENGTH]: {
        enabled: shouldCheckLength,
        fn: isLongEnough.bind(null, body, requiredLength)
      }
    }

    // array to force the order
    const [success, failedChecks] = [
      CONTAINS_ISSUE_NUMBER, CONTAINS_URL, MINIMUM_LENGTH
    ].reduce(([success, failedChecks], checkName) => {
      const {enabled, fn: check} = checksMapping[checkName]

      if (enabled) {
        const res = check()
        if (!res) {
          failedChecks.push(`'${checkName}'`)
        }

        success = success || res
      }

      return [success, failedChecks]
    }, [false, []])

    if (!success && failedChecks.length > 0) {
      throw new Error(`PR's body failed check ${failedChecks[0]}`)
    }
  }
}
