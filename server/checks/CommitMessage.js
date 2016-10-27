import Check, { getPayloadFn } from './Check'
import { logger } from '../../common/debug'
import { getIn } from '../../common/util'
import * as EVENTS from '../model/GithubEvents'

const CHECK_TYPE = 'commitmessage'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const CONTEXT = 'zappr/commit/message'
const SHORT_SHA_LENGTH = 7
const createStatePayload = getPayloadFn(CONTEXT)

/**
 * Takes RegExps and returns a function that takes a string
 * and returns true if the string matches at least one of the
 * RegExps.
 *
 * @param regexes The RegExps to test against
 * @returns {Function} A matcher function that takes a string to test
 */
export function getAnyMatcherFn(regexes) {
  return function (string) {
    return regexes.reduce((result, regex) => result || regex.test(string), false)
  }
}

/**
 * Takes a commit object from the Github API and decides if it is
 * a merge commit. Merge commits are commits with more than 1 parent.
 *
 * @param commit The commit object from Github API
 * @returns {boolean} True iff this commit has more than one parent
 */
function isMergeCommit({parents}) {
  return Array.isArray(parents) && parents.length > 1
}

export default class CommitMessage extends Check {
  static TYPE = CHECK_TYPE;
  static CONTEXT = CONTEXT;
  static NAME = 'Commit message check';
  static HOOK_EVENTS = [EVENTS.PULL_REQUEST];

  /**
   * @param {GithubService} github
   */
  constructor(github) {
    super()
    this.github = github
  }

  async fetchCommitsAndSetStatus({config, pull_request, repository, token}) {
    /**
     * Strategy: On every pull request that is opened or synced,
     * check that all commit messages match at least one of one or more patterns.
     */
    const {full_name, owner, name} = repository
    const {number, head} = pull_request
    const {sha} = head
      // safely get deep property
    const patterns = getIn(config, ['commit', 'message', 'patterns'], [])
    if (patterns && Array.isArray(patterns) && patterns.length > 0) {
      // set commit state to pending
      await this.github.setCommitStatus(owner.login, name, sha, createStatePayload('Commit message validation in progress.', 'pending'), token)
      // get all the commits in the PR
      const commits = await this.github.fetchPullRequestCommits(owner.login, name, number, token)
      // get matcher function for all those patterns
      const matcherFn = getAnyMatcherFn(patterns.map(pattern => new RegExp(pattern)))
      // gather non-merge commits with bad messages
      const badCommits = commits.filter(c => !isMergeCommit(c) && !matcherFn(c.commit.message.trim()))

      if (badCommits.length === 0) {
        // all commits are fine
        this.github.setCommitStatus(owner.login, name, sha, createStatePayload('All commit messages match at least one configured pattern.'), token)
        info(`${full_name}#${number}: Set status to success (all commit messages match at least one pattern).`)
      } else {
        // there are some bad commits
        const badSHAs = badCommits.map(({sha}) => sha.substring(0, SHORT_SHA_LENGTH - 1)).join(', ')
        const usePlural = badCommits.length > 1
        this.github.setCommitStatus(owner.login, name, sha, createStatePayload(`${usePlural ? 'Commits' : 'Commit'} ${badSHAs} ${usePlural ? 'do' : 'does'} not match configured patterns.`, 'failure'), token)
        info(`${full_name}#${number}: Set status to failure (${badCommits.length} commit(s) do not match any pattern).`)
      }
    } else {
      // no patterns were configured
      this.github.setCommitStatus(owner.login, name, sha, createStatePayload('No patterns configured to match commit messages against.'), token)
      info(`${full_name}#${number}: Set status to success (no patterns configured).`)
    }
  }

  async execute(config, hookPayload, token) {
    const {action, repository, pull_request, number} = hookPayload
    const {state} = pull_request
    const {name, full_name} = repository
    const owner = repository.owner.login

    let sha = pull_request.head.sha
    if (state !== 'open' || (action !== 'opened' && action !== 'synchronize')) {
      // this is not the action we are looking for
      info(`${full_name}#${number}: Nothing to do, action was "${action}" with state "${state}".`)
      return
    }
    try {
      await this.fetchCommitsAndSetStatus({config, repository, pull_request, token})
    }
    catch (e) {
      error(`${full_name}#${number}: Set status to error (${e.message}, ${e}).`)
      this.github.setCommitStatus(owner, name, sha, createStatePayload(e.message, 'error'), token)
    }
  }
}
