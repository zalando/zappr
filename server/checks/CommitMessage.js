import Check from './Check'
import { logger } from '../../common/debug'
import { getIn } from '../../common/util'
import * as EVENTS from '../model/GithubEvents'

const CHECK_TYPE = 'commitmessage'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const context = 'zappr-commitmessage'

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

function isMergeCommit({parents}) {
  return Array.isArray(parents) && parents.length > 1
}

function createStatePayload(description, state = 'success') {
  return {
    state,
    context,
    description
  }
}

export default class CommitMessage extends Check {
  static TYPE = CHECK_TYPE;
  static NAME = 'Commit message check';
  static HOOK_EVENTS = [EVENTS.PULL_REQUEST];

  static async execute(github, config, hookPayload, token) {
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
      /**
       * Strategy: On every pull request that is opened or synced,
       * check that all commit messages match at least one of one or more patterns.
       */
      // safely get deep property
      const patterns = getIn(config, ['commit', 'message', 'patterns'], [])
      if (patterns && Array.isArray(patterns) && patterns.length > 0) {
        // set commit state to pending
        await github.setCommitStatus(owner, name, sha, createStatePayload('Commit message validation in progress.', 'pending'), token)
        // get all the commits in the PR
        const commits = await github.fetchPullRequestCommits(owner, name, number, token)
        // get matcher function for all those patterns
        const matcherFn = getAnyMatcherFn(patterns.map(pattern => new RegExp(pattern)))
        // gather non-merge commits with bad messages
        const evilCommits = commits.filter(c => !isMergeCommit(c) && !matcherFn(c.commit.message))
        if (evilCommits.length === 0) {
          // YAY
          github.setCommitStatus(owner, name, sha, createStatePayload('All commit messages match at least one configured pattern.'), token)
          info(`${full_name}#${number}: Set status to success (all commit messages match at least one pattern).`)
        } else {
          // YOU ARE A BAD PERSON
          const evilSHAs = evilCommits.map(({sha}) => sha.substring(0, 6)).join(', ')
          github.setCommitStatus(owner, name, sha, createStatePayload( `${evilCommits.length > 1 ? 'Commits' : 'Commit'} ${evilSHAs} do not match configured patterns.`, 'failure'), token)
          info(`${full_name}#${number}: Set status to failure (${evilCommits.length} commit(s) do not match any pattern).`)
        }
      } else {
        // CRICKETS
        github.setCommitStatus(owner, name, sha, createStatePayload('No patterns configured to match commit messages against.'), token)
        info(`${full_name}#${number}: Set status to success (no patterns configured).`)
      }
    }
    catch (e) {
      error(`${full_name}#${number}: Set status to error (${e.message}, ${e}).`)
      github.setCommitStatus(owner, name, sha, createStatePayload(e.message, 'error'), token)
    }
  }
}