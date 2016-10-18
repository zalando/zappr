import Check from './Check'
import { logger } from '../../common/debug'
import * as EVENTS from '../model/GithubEvents'

const info = logger('autobranch', 'info')
const error = logger('autobranch', 'error')

/**
 * Transform an array of strings into a single string.
 *
 * @param {Array.<string>} arr
 * @param {string} join - Join strings with this character.
 * @returns {string}
 */
function arrayToString(arr, join = '-') {
  if (!Array.isArray(arr) || arr.length === 0) {
    return ''
  }
  return arr.filter(x => typeof x === 'string')
            .map(s => safeString(s, join))
            .join(join)
}

/**
 * Trim, transform to lower case and replace forbidden characters.
 * https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html
 *
 * @param {string} str
 * @param {string} join - Join words with this character.
 * @returns {string}
 */
function safeString(str, join = '-') {
  return str.trim()
            .replace(/[\.@\?\*\[~\^:]/g, '')   // drop forbidden characters
            .replace(/\s*[\\\/\s]+\s*/g, join) // replace (consecutive) slashes with separator
            .replace(/\s+/g, join)             // replace (consecutive) whitespace with separator
            .toLowerCase()
}

export default class Autobranch extends Check {

  static TYPE = 'autobranch'
  static NAME = 'Automatic branch creation'
  static HOOK_EVENTS = [EVENTS.ISSUES]


  /**
   * @param {GithubService} github
   */
  constructor(github) {
    super()
    this.github = github
  }

  static createBranchNameFromIssue({number, title, labels}, {length = 60, pattern = '{number}-{title}'}) {
    return pattern.replace('{number}', number)
                  .replace('{title}', safeString(title))
                  .replace('{labels}', arrayToString(labels.map(l => l.name)))
                  .substring(0, length)
  }

  async execute({config, payload, token}) {
    const {action, issue, repository} = payload
    const branchName = Autobranch.createBranchNameFromIssue(issue, config.autobranch)
    // only interested in open events right now
    if (action !== 'opened') {
      info(`${repository.full_name}: Ignore issue #${issue.number}. Action was "${action}" instead of "opened".`)
      return
    }
    try {
      const owner = repository.owner.login
      const repo = repository.name
      const {sha} = await this.github.getHead(owner, repo, repository.default_branch, token)
      // branch could exist already
      await this.github.createBranch(owner, repo, branchName, sha, token)
      info(`Created branch ${branchName} for ${sha} in ${repository.full_name}`)
    } catch (e) {
      // but we don't care
      error(`Could not create branch ${branchName} for ${sha} in ${repository.full_name}`, e)
    }
  }
}
