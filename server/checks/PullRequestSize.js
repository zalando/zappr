import Check, { getPayloadFn } from './Check'
import { PULL_REQUEST } from '../model/GithubEvents'
import { logger } from '../../common/debug'

const CHECK_TYPE = 'pullrequestsize'
const CONTEXT = 'zappr/pr/size'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const debug = logger(CHECK_TYPE)
const createStatePayload = getPayloadFn(CONTEXT)


export default class PullRequestSize extends Check {
  static TYPE = CHECK_TYPE;
  static CONTEXT = CONTEXT;
  static HOOK_EVENTS = [PULL_REQUEST];
  static NAME = 'Pull request size check'

  constructor(github) {
    super()
    this.github = github;
  }

  async checkPRSizeAndSetStatus({pull_request, repository, token, config}) {
    const {fullName, name, owner} = repository
    const {number, additions, deletions, changed_files} = pull_request
    const max_additions = getIn(config, ['pull-request', 'size', 'max', 'additions'], [])
    const max_deletions = getIn(config, ['pull-request', 'size', 'max', 'deletions'], [])
    const max_changed_files = getIn(config, ['pull-request', 'size', 'max', 'changed_files'], [])

    const checkEnabled = max_additions.length > 0 ? max_deletions.length > 0 ? max_changed_files.length > 0 : false : false
    let msg, status;

    if (checkEnabled) {
      if (additions > max_additions) {
        info(`${fullName}#${number}: Failed the PR due to more additions than allowed.`);
        status = createStatePayload(`PR adds too much lines.`, 'failure');
      } else if (deletions > max_deletions) {
        info(`${fullName}#${number}: Failed the PR due to more deletions than allowed.`);
        status = createStatePayload(`PR deletes too much lines.`, 'failure');
      } else if (changed_files > max_changed_files) {
        info(`${fullName}#${number}: Failed the PR due to more files changed than allowed.`);
        status = createStatePayload(`PR changes too much files.`, 'failure');
      } else {
        msg = `PR Size restrictions are met.`;
        info(`${fullName}#${number}: ${msg}`);
        status = createStatePayload(msg);
      }
    } else {
      info(`${fullName}#${number}: No PR size settings set.`);
      status = createStatePayload(`No PR size settings set.`);
    }

    await this.github.setCommitStatus(owner.login, name, pull_request.head.sha, status, token);
    info(`${fullName}#${number}: Set status to ${status.state}.`)
  }

  async execute(config, hookPayload, token) {
    const {action, repository, number, pull_request} = hookPayload
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    let status;

    try {
      if (pull_request.state === 'open' && ['opened', 'edited', 'reopened', 'synchronize'].indexOf(action) !== -1) {
        await this.checkPRSizeAndSetStatus({pull_request, repository, token, config})
      }
    } catch (e) {
      error(`${fullName}#${number}: Could not execute ${NAME}`, e)
      status = createStatePayload(`Error: ${e.message}`, 'error')
      await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token);
    }
  }
}
