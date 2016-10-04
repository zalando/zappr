import {
  Approval,
  Autobranch,
  CommitMessage,
  Specification,
  PullRequestLabels
} from '../checks'
import createAuditService from '../service/AuditServiceCreator'
import { logger } from '../../common/debug'
import { githubService as defaultGithubService } from '../service/GithubService'
import { repositoryHandler as defaultRepositoryHandler } from './RepositoryHandler'
import { pullRequestHandler as defaultPullRequestHandler } from './PullRequestHandler'
import ZapprConfiguration from '../zapprfile/Configuration'

const info = logger('hook', 'info')

class HookHandler {

  /**
   * @param {GithubService} githubService
   * @param {RepositoryHandler} repositoryHandler
   * @param {PullRequestHandler} pullRequestHandler
   * @param {AuditService} auditService
   */
  constructor(githubService = defaultGithubService,
              repositoryHandler = defaultRepositoryHandler,
              pullRequestHandler = defaultPullRequestHandler,
              auditService = createAuditService()) {
    this.githubService = githubService
    this.repositoryHandler = repositoryHandler
    this.pullRequestHandler = pullRequestHandler
    this.approval = new Approval(this.githubService, this.pullRequestHandler, auditService)
    this.autobranch = new Autobranch(this.githubService)
    this.commitMessage = new CommitMessage(this.githubService)
    this.specification = new Specification(this.githubService)
    this.pullrequestlabels = new PullRequestLabels(this.githubService)
  }


  /**
   * Executes hook triggered by Github.
   *
   * @param  {string} event
   * @param  {object} payload
   * @return {object}
   */
  async onHandleHook(event, payload) {
    async function executeCheck(checkInstance, dbRepo, args) {
      const check = dbRepo.checks.filter(check => check.type === checkInstance.TYPE && !!check.token)[0]
      if (!!check) {
        try {
          await checkInstance.execute.apply(checkInstance, [...args, check.token])
        } catch(e) {
          // TODO implement
        }
      }
    }

    if (payload.repository) {
      const {name, id, owner} = payload.repository
      const repo = await this.repositoryHandler.onGetOne(id, null, true)
      let config = {}
      if (repo.checks.length) {
        const zapprFileContent = await this.githubService.readZapprFile(owner.login, name, repo.checks[0].token)
        const zapprfile = new ZapprConfiguration(zapprFileContent)
        config = zapprfile.getConfiguration()
      }
      if (Specification.isTriggeredBy(event)) {
        executeCheck(this.specification, repo, [config, payload]);
      }
      if (Approval.isTriggeredBy(event)) {
        executeCheck(this.approval, repo, [config, event, payload, repo.id])
      }
      if (Autobranch.isTriggeredBy(event)) {
        executeCheck(this.autobranch, repo, [config, payload])
      }
      if (CommitMessage.isTriggeredBy(event)) {
        executeCheck(this.commitMessage, repo, [config, payload])
      }
      if (PullRequestLabels.isTriggeredBy(event)) {
        executeCheck(this.pullrequestlabels, repo, [config, payload])
      }
    }
    return {
      message: "THANKS"
    }
  }
}

export const hookHandler = new HookHandler()
