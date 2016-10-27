import {
  Approval,
  Autobranch,
  CommitMessage,
  Specification,
  PullRequestLabels,
  PullRequestTasks,
  getCheckByType
} from './index'
import { getPayloadFn } from './Check'
import createAuditService from '../service/AuditServiceCreator'
import { githubService as defaultGithubService } from '../service/GithubService'
import { pullRequestHandler as defaultPullRequestHandler } from '../handler/PullRequestHandler'
import merge from 'lodash/merge'
import { logger } from '../../common/debug'
const info = logger('checkrunner', 'info')
const error = logger('checkrunner', 'error')

function getToken(dbRepo, checkType) {
  const check = dbRepo.checks.filter(check => check.type === checkType && !!check.token)[0]
  if (!!check) {
    return Promise.resolve(check.token)
  }
  return Promise.reject(`No token available for ${checkType} of repo ${dbRepo.id}`)
}

export default class CheckRunner {
  constructor(githubService = defaultGithubService,
              pullRequestHandler = defaultPullRequestHandler,
              auditService = createAuditService()) {
    this.githubService = githubService
    this.pullRequestHandler = pullRequestHandler
    this.approval = new Approval(this.githubService, this.pullRequestHandler, auditService)
    this.autobranch = new Autobranch(this.githubService)
    this.commitMessage = new CommitMessage(this.githubService)
    this.specification = new Specification(this.githubService)
    this.pullRequestLabels = new PullRequestLabels(this.githubService)
    this.pullRequestTasks = new PullRequestTasks(this.githubService)
  }

  async release(dbRepo, checkType, accessToken) {
    const owner = dbRepo.json.owner.login
    const name = dbRepo.json.name
    info(`${owner}/${name}: Release locks of ${checkType}`)

    const openPullRequests = await this.githubService.getPullRequests(owner, name, accessToken, 'open', true)
    const status = getPayloadFn(getCheckByType(checkType).CONTEXT)('This check is disabled.')
    const processedPullRequests = openPullRequests.map(async pullRequest =>
      await this.githubService.setCommitStatus(owner, name, pullRequest.head.sha, status, accessToken))
    return Promise.all(processedPullRequests)
  }

  async handleExistingPullRequests(dbRepo, checkType, {config, token}) {
    const PR_TYPES = [
      Approval.TYPE,
      Specification.TYPE,
      PullRequestLabels.TYPE,
      PullRequestTasks.TYPE,
      CommitMessage.TYPE,
    ]
    if (PR_TYPES.indexOf(checkType) !== -1) {
      const repository = dbRepo.json
      const owner = dbRepo.json.owner.login
      const name = dbRepo.json.name
      const openPullRequests = await this.githubService.getPullRequests(owner, name, token, 'open', true)

      info(`${owner}/${name}: Run ${checkType} for all open pull requests`)
      const processedPullRequests = openPullRequests.map(async pullRequest => {
        const dbPR = await this.pullRequestHandler.onGet(dbRepo.id, pullRequest.number)
        switch (checkType) {
          case Approval.TYPE:
            return this.approval.fetchApprovalsAndSetStatus(
              repository,
              pullRequest,
              dbPR ? dbPR.last_push : new Date(0), // beginning of time
              config,
              token
            )
          case Specification.TYPE:
            return this.specification.validate(config, pullRequest, repository, token)
          case PullRequestLabels.TYPE:
            return this.pullRequestLabels.fetchLabelsAndSetStatus({
              config,
              pull_request: pullRequest,
              repository,
              token
            })
          case PullRequestTasks.TYPE:
            return this.pullRequestTasks.countTasksAndSetStatus({
              pull_request: pullRequest,
              repository,
              token
            })
          case CommitMessage.TYPE:
            return this.commitMessage.fetchCommitsAndSetStatus({
              pull_request: pullRequest,
              config,
              token,
              repository
            })
        }
      })

      return Promise.all(processedPullRequests)
    }
  }

  async handleGithubWebhook(dbRepo, checkArgs) {
    const {event} = checkArgs
    const owner = dbRepo.json.owner.login
    const name = dbRepo.json.name
    info(`${owner}/${name}: Handling Github event ${event}.${checkArgs.payload.action}`)

    if (PullRequestLabels.isTriggeredBy(event)) {
      info(`${owner}/${name}: Executing check PullRequestLabels`)
      await getToken(dbRepo, PullRequestLabels.TYPE).then(token =>
        this.pullRequestLabels.execute(checkArgs.config, checkArgs.payload, token))
    }

    if (Specification.isTriggeredBy(event)) {
      info(`${owner}/${name}: Executing check Specification`)
      await getToken(dbRepo, Specification.TYPE).then(token =>
        this.specification.execute(checkArgs.config, checkArgs.payload, token))
    }

    if (Approval.isTriggeredBy(event)) {
      info(`${owner}/${name}: Executing check Approval`)
      await getToken(dbRepo, Approval.TYPE).then(token =>
        this.approval.execute(checkArgs.config, event, checkArgs.payload, token, dbRepo.id))
    }

    if (Autobranch.isTriggeredBy(event)) {
      info(`${owner}/${name}: Executing check Autobranch`)
      await getToken(dbRepo, Autobranch.TYPE).then(token =>
        this.autobranch.execute(checkArgs.config, checkArgs.payload, token))
    }

    if (CommitMessage.isTriggeredBy(event)) {
      info(`${owner}/${name}: Executing check CommitMessage`)
      await getToken(dbRepo, CommitMessage.TYPE).then(token =>
        this.commitMessage.execute(checkArgs.config, checkArgs.payload, token))
    }

    if (PullRequestTasks.isTriggeredBy(event)) {
      info(`${owner}/${name}: Executing check PullRequestTasks`)
      await getToken(dbRepo, PullRequestTasks.TYPE).then(token =>
        this.pullRequestTasks.execute(checkArgs.config, checkArgs.payload, token))
    }
  }
}

export const checkRunner = new CheckRunner()
