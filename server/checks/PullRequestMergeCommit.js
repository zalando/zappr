import Check, { getPayloadFn } from './Check'
import { PULL_REQUEST } from '../model/GithubEvents'
import { getIn, setDifference } from '../../common/util';
import { logger } from '../../common/debug'

const CHECK_TYPE = 'pullrequestmergecommit'
const CONTEXT = 'zappr/pr/mergecommit'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const debug = logger(CHECK_TYPE)
const createStatePayload = getPayloadFn(CONTEXT)

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

export function generateStatus(commits) {
  // gather merge commits
  const badCommits = commits.filter(c => isMergeCommit(c))

  if (badCommits.length === 0) {
    return createStatePayload(`PR doesn't contain merge commits.`);
  } else {
    return createStatePayload(`PR contains ${badCommits.length} merge ${badCommits.length > 1 ? 'commits' : 'commit'}.`, 'failure');
  }
}

export default class PullRequestMergeCommit extends Check {
  static TYPE = CHECK_TYPE;
  static CONTEXT = CONTEXT;
  static HOOK_EVENTS = [PULL_REQUEST];
  static NAME = 'Pull request merge commit check';

  constructor(github) {
    super()
    this.github = github
  }

  async fetchCommitsAndSetStatus({repository, pull_request, token}) {
    /**
     * Strategy: On every pull request that is opened or synced,
     * check that all commit messages match at least one of one or more patterns.
     */
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    const number = pull_request.number

    // set commit state to pending
    await this.github.setCommitStatus(owner.login, name, sha, createStatePayload('Merge commit validation in progress.', 'pending'), token)
    // get all the commits in the PR
    const commits = await this.github.fetchPullRequestCommits(repoOwner, repoName, number, token)

    let status = generateStatus(commits)
    info(`${fullName}#${number}: Set status to ${status.state}`)
    await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
  }

  async execute(config, hookPayload, token) {
    const {action, repository, number, pull_request} = hookPayload
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    try {
      if (['opened', 'reopened', 'synchronize'].indexOf(action) !== -1 && pull_request.state === 'open') {
        await this.fetchCommitsAndSetStatus({repository, pull_request, token})
      }
    } catch (e) {
      error(`${fullName}#${number}: Could not execute Pull Request Merge commit check`, e)
      const status = createStatePayload(`Error: ${e.message}`, 'error')
      await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
    }
  }
}
