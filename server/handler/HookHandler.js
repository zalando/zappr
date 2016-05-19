import merge from 'lodash/merge'

import nconf from '../nconf'
import { Approval, Autobranch, CommitMessage } from '../checks'
import { logger } from '../../common/debug'
import { githubService } from '../service/GithubService'
import { repositoryHandler } from './RepositoryHandler'
import { pullRequestHandler } from './PullRequestHandler'

const info = logger('hook', 'info')
const DEFAULT_CONFIG = nconf.get('ZAPPR_DEFAULT_CONFIG')

class HookHandler {
  constructor(github = githubService) {
    this.github = github
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
      const repo = await repositoryHandler.onGetOne(id, null, true)
      const zapprUserConfig = repo.checks.length ?
        await this.github.readZapprFile(owner.login, name, repo.checks[0].token)
        : {}

      const config = merge({}, DEFAULT_CONFIG, zapprUserConfig)

      if (Approval.isTriggeredBy(event)) {
        getToken(repo, Approval.TYPE).then(token =>
          Approval.execute(this.github, config, payload, token, repo.id, pullRequestHandler)
        )
      }
      if (Autobranch.isTriggeredBy(event)) {
        getToken(repo, Autobranch.TYPE).then(token =>
          Autobranch.execute(this.github, config, payload, token)
        )
      }
      if (CommitMessage.isTriggeredBy(event)) {
        getToken(repo, CommitMessage.TYPE).then(token =>
          CommitMessage.execute(this.github, config, payload, token)
        )
      }
    }
    return {
      message: "THANKS"
    }
  }
}

export const hookHandler = new HookHandler()
