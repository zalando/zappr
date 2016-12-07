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

/**
 * Returns a map of {<checkType>: <token>} for the given repository.
 * If repository has no checks, returns empty map.
 *
 * @param dbRepo
 * @returns {*}
 */
function getTokens(dbRepo) {
  return (dbRepo.checks || []).reduce((agg, check) => ({[check.type]: check.token, ...agg}), {})
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
    const tokens = getTokens(dbRepo)
    info(`${owner}/${name}: Handling Github event ${event}.${checkArgs.payload.action}`)

    if (PullRequestLabels.isTriggeredBy(event) && tokens[PullRequestLabels.TYPE]) {
      info(`${owner}/${name}: Executing check PullRequestLabels`)
      this.checkHandler.markExecutionStart(checkId)
      try {
        await this.pullRequestLabels.execute(checkArgs.config, checkArgs.payload, tokens[PullRequestLabels.TYPE])
        this.checkHandler.markExecutionEnd(checkId, ...)
      } catch(e) {
        this.checkHandler.markExecutionFailure(checkId, ...)
      }
    }

    if (Specification.isTriggeredBy(event) && tokens[Specification.TYPE]) {
      info(`${owner}/${name}: Executing check Specification`)
      await this.specification.execute(checkArgs.config, checkArgs.payload, tokens[Specification.TYPE])
    }

    if (Approval.isTriggeredBy(event) && tokens[Approval.TYPE]) {
      info(`${owner}/${name}: Executing check Approval`)
      await this.approval.execute(checkArgs.config, event, checkArgs.payload, tokens[Approval.TYPE], dbRepo.id)
    }

    if (Autobranch.isTriggeredBy(event) && tokens[Autobranch.TYPE]) {
      info(`${owner}/${name}: Executing check Autobranch`)
      await this.autobranch.execute(checkArgs.config, checkArgs.payload, tokens[Autobranch.TYPE])
    }

    if (CommitMessage.isTriggeredBy(event) && tokens[CommitMessage.TYPE]) {
      info(`${owner}/${name}: Executing check CommitMessage`)
      await this.commitMessage.execute(checkArgs.config, checkArgs.payload, tokens[CommitMessage.TYPE])
    }

    if (PullRequestTasks.isTriggeredBy(event) && tokens[PullRequestTasks.TYPE]) {
      info(`${owner}/${name}: Executing check PullRequestTasks`)
      await this.pullRequestTasks.execute(checkArgs.config, checkArgs.payload, tokens[PullRequestTasks.TYPE])
    }
  }
}

export const checkRunner = new CheckRunner()
