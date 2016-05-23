import merge from 'lodash/merge'

import nconf from '../nconf'
import { Approval, Autobranch, CommitMessage } from '../checks'
import { logger } from '../../common/debug'
import { githubService as defaultGithubService } from '../service/GithubService'
import { repositoryHandler as defaultRepositoryHandler } from './RepositoryHandler'
import { pullRequestHandler as defaultPullRequestHandler } from './PullRequestHandler'

const info = logger('hook', 'info')
const DEFAULT_CONFIG = nconf.get('ZAPPR_DEFAULT_CONFIG')

class HookHandler {

  /**
   * @param {GithubService} githubService
   * @param {RepositoryHandler} repositoryHandler
   * @param {PullRequestHandler} pullRequestHandler
   */
  constructor(githubService = defaultGithubService,
              repositoryHandler = defaultRepositoryHandler,
              pullRequestHandler = defaultPullRequestHandler) {
    this.githubService = githubService
    this.repositoryHandler = repositoryHandler
    this.pullRequestHandler = pullRequestHandler
    this.approval = new Approval(this.githubService, this.pullRequestHandler)
    this.autobranch = new Autobranch(this.githubService)
    this.commitMessage = new CommitMessage(this.githubService)
  }

  /**
   * Executes hook triggered by Github.
   *
   * @param  {string} event
   * @param  {object} payload
   * @return {object}
   */
  async onHandleHook(event, payload) {
    async function getToken(dbRepo, checkType) {
      const check = dbRepo.checks.filter(check => check.type === checkType && !!check.token)[0]
      if (!!check) {
        return Promise.resolve(check.token)
      }
    }

    if (payload.repository) {
      const {name, id, owner} = payload.repository
      const repo = await this.repositoryHandler.onGetOne(id, null, true)
      const zapprUserConfig = repo.checks.length ?
        await this.githubService.readZapprFile(owner.login, name, repo.checks[0].token)
        : {}

      const config = merge({}, DEFAULT_CONFIG, zapprUserConfig)

      if (Approval.isTriggeredBy(event)) {
        getToken(repo, Approval.TYPE).then(token =>
          this.approval.execute(config, payload, token, repo.id)
        )
      }
      if (Autobranch.isTriggeredBy(event)) {
        getToken(repo, Autobranch.TYPE).then(token =>
          this.autobranch.execute(config, payload, token)
        )
      }
      if (CommitMessage.isTriggeredBy(event)) {
        getToken(repo, CommitMessage.TYPE).then(token =>
          this.commitMessage.execute(config, payload, token)
        )
      }
    }
    return {
      message: "THANKS"
    }
  }
}

export const hookHandler = new HookHandler()
