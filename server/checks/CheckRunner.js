import {
  Approval,
  Autobranch,
  CommitMessage,
  Specification,
  PullRequestMilestone,
  PullRequestLabels,
  PullRequestMergeCommit,
  PullRequestTasks,
  getCheckByType
} from './index'
import { getPayloadFn } from './Check'
import createAuditService from '../service/AuditServiceCreator'
import { checkHandler as defaultCheckHandler } from '../handler/CheckHandler'
import { githubService as defaultGithubService } from '../service/GithubService'
import { pullRequestHandler as defaultPullRequestHandler } from '../handler/PullRequestHandler'
import { findDeepInObj } from '../../common/util'
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

/**
 * Returns when this GH event was triggered based on payload.
 *
 * Necessary because there is no top-level timestamp in the payload for every event,
 * we have to look into the event itself and check different properties. Not cool.
 * So this naive implementation looks for properties /.+?_at/ with value /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/
 * and parses them and returns the most current.
 *
 * This approach may now work well in 100% of the cases, but avoids that we forget to
 * change it in the future when we support new events.
 *
 * @param payload
 */
export function getTriggeredAt(payload) {
  const endsWithAt = /^.+?_at$/
  const looksLikeDate = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/
  return findDeepInObj(payload, key => endsWithAt.test(key))
  .filter(([_, val]) => looksLikeDate.test(val))
  .map(([_, val]) => Date.parse(val))
  .reduce((mostCurrent, ts) => Math.max(mostCurrent, ts), 0)
}

export default class CheckRunner {
  constructor(githubService = defaultGithubService,
              pullRequestHandler = defaultPullRequestHandler,
              checkHandler = defaultCheckHandler,
              auditService = createAuditService()) {
    this.githubService = githubService
    this.pullRequestHandler = pullRequestHandler
    this.checkHandler = checkHandler
    this.approval = new Approval(this.githubService, this.pullRequestHandler, auditService)
    this.autobranch = new Autobranch(this.githubService)
    this.commitMessage = new CommitMessage(this.githubService)
    this.specification = new Specification(this.githubService)
    this.pullRequestMilestone = new PullRequestMilestone(this.githubService)
    this.pullRequestLabels = new PullRequestLabels(this.githubService)
    this.pullRequestMergeCommit = new PullRequestMergeCommit(this.githubService)
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
      PullRequestMilestone.TYPE,
      PullRequestLabels.TYPE,
      PullRequestMergeCommit.TYPE,
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
          case PullRequestMilestone.TYPE:
            return this.pullRequestMilestone.fetchMilestoneAndSetStatus({
              pull_request: pullRequest,
              repository,
              token
            })
          case PullRequestLabels.TYPE:
            return this.pullRequestLabels.fetchLabelsAndSetStatus({
              config,
              pull_request: pullRequest,
              repository,
              token
            })
          case PullRequestMergeCommit.TYPE:
            return this.pullRequestMergeCommit.fetchMilestoneAndSetStatus({
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
    const {event, payload, config} = checkArgs
    const owner = dbRepo.json.owner.login
    const name = dbRepo.json.name
    const tokens = getTokens(dbRepo)
    const start = Date.now()
    const delay = start - getTriggeredAt(payload)
    info(`${owner}/${name}: Handling Github event ${event}.${payload.action}`)

    if (PullRequestMilestone.isTriggeredBy(event) && tokens[PullRequestMilestone.TYPE]) {
      info(`${owner}/${name}: Executing check PullRequestMilestone`)
      await this.checkHandler.onExecutionStart(dbRepo.id, PullRequestMilestone.TYPE, delay)
      try {
        await this.pullRequestMilestone.execute(config, payload, tokens[PullRequestMilestone.TYPE])
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestMilestone.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestMilestone.TYPE, Date.now() - start, false)
      }
    }

    if (PullRequestLabels.isTriggeredBy(event) && tokens[PullRequestLabels.TYPE]) {
      info(`${owner}/${name}: Executing check PullRequestLabels`)
      await this.checkHandler.onExecutionStart(dbRepo.id, PullRequestLabels.TYPE, delay)
      try {
        await this.pullRequestLabels.execute(config, payload, tokens[PullRequestLabels.TYPE])
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestLabels.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestLabels.TYPE, Date.now() - start, false)
      }
    }

    if (PullRequestMergeCommit.isTriggeredBy(event) && tokens[PullRequestMergeCommit.TYPE]) {
      info(`${owner}/${name}: Executing check PullRequestMergeCommit`)
      await this.checkHandler.onExecutionStart(dbRepo.id, PullRequestMergeCommit.TYPE, delay)
      try {
        await this.pullRequestMergeCommit.execute(config, payload, tokens[PullRequestMergeCommit.TYPE])
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestMergeCommit.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestMergeCommit.TYPE, Date.now() - start, false)
      }
    }

    if (Specification.isTriggeredBy(event) && tokens[Specification.TYPE]) {
      info(`${owner}/${name}: Executing check Specification`)
      await this.checkHandler.onExecutionStart(dbRepo.id, Specification.TYPE, delay)
      try {
        await this.specification.execute(config, payload, tokens[Specification.TYPE])
        await this.checkHandler.onExecutionEnd(dbRepo.id, Specification.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, Specification.TYPE, Date.now() - start, false)
      }
    }

    if (Approval.isTriggeredBy(event) && tokens[Approval.TYPE]) {
      info(`${owner}/${name}: Executing check Approval`)
      await this.checkHandler.onExecutionStart(dbRepo.id, Approval.TYPE, delay)
      try {
        await this.approval.execute(config, event, payload, tokens[Approval.TYPE], dbRepo.id)
        await this.checkHandler.onExecutionEnd(dbRepo.id, Approval.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, Approval.TYPE, Date.now() - start, false)
      }
    }

    if (Autobranch.isTriggeredBy(event) && tokens[Autobranch.TYPE]) {
      info(`${owner}/${name}: Executing check Autobranch`)
      await this.checkHandler.onExecutionStart(dbRepo.id, Autobranch.TYPE, delay)
      try {
        await this.autobranch.execute(config, payload, tokens[Autobranch.TYPE])
        await this.checkHandler.onExecutionEnd(dbRepo.id, Autobranch.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, Autobranch.TYPE, Date.now() - start, false)
      }
    }

    if (CommitMessage.isTriggeredBy(event) && tokens[CommitMessage.TYPE]) {
      info(`${owner}/${name}: Executing check CommitMessage`)
      await this.checkHandler.onExecutionStart(dbRepo.id, CommitMessage.TYPE, delay)
      try {
        await this.commitMessage.execute(config, payload, tokens[CommitMessage.TYPE])
        await this.checkHandler.onExecutionEnd(dbRepo.id, CommitMessage.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, CommitMessage.TYPE, Date.now() - start, false)
      }
    }

    if (PullRequestTasks.isTriggeredBy(event) && tokens[PullRequestTasks.TYPE]) {
      info(`${owner}/${name}: Executing check PullRequestTasks`)
      await this.checkHandler.onExecutionStart(dbRepo.id, PullRequestTasks.TYPE, delay)
      try {
        await this.pullRequestTasks.execute(config, payload, tokens[PullRequestTasks.TYPE])
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestTasks.TYPE, Date.now() - start, true)
      } catch (e) {
        await this.checkHandler.onExecutionEnd(dbRepo.id, PullRequestTasks.TYPE, Date.now() - start, false)
      }
    }
  }
}

export const checkRunner = new CheckRunner()
