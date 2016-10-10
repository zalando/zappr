import Check, { getPayloadFn } from './Check'
import { PULL_REQUEST } from '../model/GithubEvents'

const CHECK_TYPE = 'pullrequesttasks'
const CONTEXT = 'zappr/pr/tasks'
const info = logger(CHECK_TYPE, 'info')
const error = logger(CHECK_TYPE, 'error')
const debug = logger(CHECK_TYPE)
const createStatePayload = getPayloadFn(CONTEXT)

function hasOpenTasks(pr) {
  const regex = /(-|\*) \[(\s|x)\]/g;
  let count = 0;
  let repoName = pr.head.repo.full_name;
  let prNo = pr.number;

  while ((match = regex.exec(pr.body)) !== null) {
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

  return count > 0;
}

export default class PullRequestTasks extends Check {
  static TYPE = CHECK_TYPE;
  static CONTEXT = CONTEXT;
  static ACTIONS = ['opened', 'edited', 'reopened'];
  static HOOK_EVENTS = [PULL_REQUEST];
  static NAME = 'Pull request tasks check'

  constructor(github) {
    super()
    this.github = github;
  }

  async execute(config, hookPayload, token) {
    const {action, repository, number, pull_request} = hookPayload
    const repoOwner = repository.owner.login
    const repoName = repository.name
    const fullName = repository.full_name

    try {
      // TODO: configuration settings

      if (pull_request.state === 'open' && ACTIONS.indexOf(action) !== -1) {
        let msg;
        let status;

        if (hasOpenTasks(pull_request)) {
          msg = `${fullName}#${number}: Failing the PR due to open tasks.`;
          info(msg);
          status = createStatePayload(msg, 'failure');
        } else {
          msg = `${fullName}#${number}: PR has no open tasks.`;
          info(msg);
          status = createStatePayload(msg);
        }

        await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token);
      }
    } catch (e) {
      error(`${fullName}#${number}: Could not execute Pull Request Labels check`, e)
      const status = createStatePayload(`Error: ${e.message}`, 'error')
      await this.github.setCommitStatus(repoOwner, repoName, pull_request.head.sha, status, token)
    }
  }
}
