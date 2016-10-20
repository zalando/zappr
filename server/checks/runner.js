import {
  Approval,
  Autobranch,
  CommitMessage,
  Specification,
  PullRequestLabels,
  PullRequestTasks
} from './index'
import * as EVENTS from '../model/GithubEvents'
import createAuditService from '../service/AuditServiceCreator'
import { githubService as defaultGithubService } from '../service/GithubService'
import { pullRequestHandler as defaultPullRequestHandler } from '../handler/PullRequestHandler'
import merge from 'lodash/merge'

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
        // fetch PRs, fake event payload
        const owner = dbRepo.json.owner.login
        const name = dbRepo.json.name
        const openPullRequests = await this.githubService.getPullRequests(owner, name, token)

        const processedPullRequests = openPullRequests.map(async pullRequest => {
          const openedPullRequestPayload = {
            action: 'opened', // we have to simulate something
            repository: dbRepo.json,
            number: pullRequest.number,
            pull_request: pullRequest
          }
          const checkArgs = {
            config,
            token,
            event: EVENTS.PULL_REQUEST,
            payload: openedPullRequestPayload,
            dbRepoId: dbRepo.id
          }
          const dbPR = await this.pullRequestHandler.onGetOne(dbRepo.id, pullRequest.number)
          switch (checkType) {
            case Approval.TYPE:
              return this.approval.fetchApprovalsAndSetStatus({
                repository: dbRepo.json,
                pull_request: pullRequest,
                lastPush: dbPR ? dbPR.last_push : new Date(0), // beginning of time
                config,
                token
              })
            case Specification.TYPE:
              return this.specification.validate(config, pull_request, repository, token)
            case PullRequestLabels.TYPE:
              return this.pullRequestLabels.fetchLabelsAndSetStatus({
                config,
                pull_request,
                repository,
                token
              })
            case PullRequestTasks.TYPE:
              return this.pullRequestTasks.countTasksAndSetStatus({
                pull_request,
                repository,
                token
              })
            case CommitMessage.TYPE:
              return this.commitMessage.fetchCommitsAndSetStatus({
                pull_request,
                config,
                token,
                repository
              })
          }
        })

        return Promise.all(processedPullRequests)
      }
    } catch (e) {
      // do something?
      console.error(e)
    }
  }

  runAll(dbRepo, checkArgs) {
    const {event} = checkArgs

    if (PullRequestLabels.isTriggeredBy(event)) {
      getToken(dbRepo, PullRequestLabels.TYPE).then(token =>
        this.pullRequestLabels.execute(merge({token}, checkArgs)))
    }

    if (Specification.isTriggeredBy(event)) {
      getToken(dbRepo, Specification.TYPE).then(token =>
        this.specification.execute(merge({token}, checkArgs)))
    }

    if (Approval.isTriggeredBy(event)) {
      getToken(dbRepo, Approval.TYPE).then(token =>
        this.approval.execute(merge({token}, checkArgs)))
    }
    if (Autobranch.isTriggeredBy(event)) {
      getToken(dbRepo, Autobranch.TYPE).then(token =>
        this.autobranch.execute(merge({token}, checkArgs)))
    }
    if (CommitMessage.isTriggeredBy(event)) {
      getToken(dbRepo, CommitMessage.TYPE).then(token =>
        this.commitMessage.execute(merge({token}, checkArgs)))
    }

    if (PullRequestTasks.isTriggeredBy(event)) {
      getToken(dbRepo, PullRequestTasks.TYPE).then(token =>
        this.pullRequestTasks.execute(merge({token}, checkArgs)))
    }
  }
}

export const checkRunner = new CheckRunner()
