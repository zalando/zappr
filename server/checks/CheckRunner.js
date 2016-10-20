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
  return Promise.reject()
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

  async release(dbRepo, checkType) {
    const owner = dbRepo.json.owner.login
    const name = dbRepo.json.name
    const token = await getToken(dbRepo, checkType)
    const openPullRequests = await this.githubService.getPullRequests(owner, name, token)
    const status = getPayloadFn(getCheckByType(checkType).CONTEXT)('This check is disabled.')

    info(`${owner}/${name} [${checkType}]: Release maybe locked pull requests`)

    const processedPullRequests = openPullRequests.map(async pullRequest =>
      await this.githubService.setCommitStatus(owner, name, pullRequest.head.sha, status, token))
    return Promise.all(processedPullRequests)
  }

  async runSingle(dbRepo, checkType, {config}) {
    try {
      const token = await getToken(dbRepo, checkType)
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
        const openPullRequests = await this.githubService.getPullRequests(owner, name, token)

        info(`${owner}/${name} [${checkType}]: Run single`)
        const processedPullRequests = openPullRequests.map(async pullRequest => {
          const dbPR = await this.pullRequestHandler.onGetOne(dbRepo.id, pullRequest.number)
          switch (checkType) {
            case Approval.TYPE:
              return this.approval.fetchApprovalsAndSetStatus({
                repository,
                pull_request: pullRequest,
                lastPush: dbPR ? dbPR.last_push : new Date(0), // beginning of time
                config,
                token
              })
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
    } catch (e) {
      error(e)
    }
  }

  async runAll(dbRepo, checkArgs) {
    const {event} = checkArgs
    const owner = dbRepo.json.owner.login
    const name = dbRepo.json.name
    info(`${owner}/${name}: Run all checks`)

    if (PullRequestLabels.isTriggeredBy(event)) {
      await getToken(dbRepo, PullRequestLabels.TYPE).then(token =>
        this.pullRequestLabels.execute(merge({token}, checkArgs)))
    }

    if (Specification.isTriggeredBy(event)) {
      await getToken(dbRepo, Specification.TYPE).then(token =>
        this.specification.execute(merge({token}, checkArgs)))
    }

    if (Approval.isTriggeredBy(event)) {
      await getToken(dbRepo, Approval.TYPE).then(token =>
        this.approval.execute(merge({token}, checkArgs)))
    }

    if (Autobranch.isTriggeredBy(event)) {
      await getToken(dbRepo, Autobranch.TYPE).then(token =>
        this.autobranch.execute(merge({token}, checkArgs)))
    }

    if (CommitMessage.isTriggeredBy(event)) {
      await getToken(dbRepo, CommitMessage.TYPE).then(token =>
        this.commitMessage.execute(merge({token}, checkArgs)))
    }

    if (PullRequestTasks.isTriggeredBy(event)) {
      await getToken(dbRepo, PullRequestTasks.TYPE).then(token =>
        this.pullRequestTasks.execute(merge({token}, checkArgs)))
    }
  }
}

export const checkRunner = new CheckRunner()
