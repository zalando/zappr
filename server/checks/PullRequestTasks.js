import Check, { getPayloadFn } from './Check'
import { PULL_REQUEST } from '../model/GithubEvents'
import { logger } from '../../common/debug'

const CHECK_TYPE = 'pullrequesttasks'
const CONTEXT = 'zappr/pr/tasks'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const debug = logger(CHECK_TYPE)
const createStatePayload = getPayloadFn(CONTEXT)

export function countOpenTasks(prBody, repoName = "", prNo = "") {
  const regex = /(-|\*) \[(\s|x)\]/g;
  let count = 0;
  let match;

  while ((match = regex.exec(prBody)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    let task = match[0];
    let marker = match[2];

    debug(`${repoName}#${prNo}: Processing task: ${task}`);

    if (marker === " ") {
      count++;
    }
  }

  info(`${repoName}#${prNo}: PR has ${count} open tasks.`);

  return count;
}

export default class PullRequestTasks extends Check {
  static TYPE = CHECK_TYPE;
  static CONTEXT = CONTEXT;
  static HOOK_EVENTS = [PULL_REQUEST];
  static NAME = 'Pull request tasks check'

  constructor(github) {
    super()
    this.github = github;
  }

  async countTasksAndSetStatus({pull_request, repository, token}) {
    const {fullName, name, owner} = repository
    const {number} = pull_request
    const openTaskCount = countOpenTasks(pull_request.body, fullName, number);
    let msg, status;

    if (openTaskCount > 0) {
      info(`${fullName}#${number}: Failed the PR due to open tasks.`);
      status = createStatePayload(`PR has ${openTaskCount} open tasks.`, 'failure');
    } else {
      msg = `PR has no open tasks.`;
      info(`${fullName}#${number}: ${msg}`);
      status = createStatePayload(msg);
    }

    await this.github.setCommitStatus(owner.login, name, pull_request.head.sha, status, token);
  }

  async execute(config, payload, token) {
    const {action, repository, number, pull_request} = payload
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name
    let status;

    try {
      if (pull_request.state === 'open' && ['opened', 'edited', 'reopened'].indexOf(action) !== -1) {
        await this.countTasksAndSetStatus({pull_request, repository, token})
      }
    } catch (e) {
      error(`${fullName}#${number}: Could not execute Pull Request Tasks check`, e)
      status = createStatePayload(`Error: ${e.message}`, 'error')
      await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token);
    }
  }
}
