import { Approval } from '../checks'
import { logger } from '../../common/debug'
import { checkHandler } from './CheckHandler'
import { repositoryHandler } from './RepositoryHandler'
import { getCheckByType } from '../checks'
import { db, Repository, Check } from '../model'
import GithubService from '../service/GithubService'

const log = logger('hook')

class HookHandler {
  constructor(github = new GithubService()) {
    this.github = github
  }

  async onEnableHooks(user, repo, enabledCHecks) {
    if (!enabledCHecks.length) {
      return;
    }
    var that = this
    // delete all first
    await checkHandler.onDeleteChecks(repo.id)
    // add those we want to have
    await Promise.all(enabledCHecks.map(async checkType => {
      let check = getCheckByType(checkType)
      if (check) {
        return Promise.all([
          that.github.updateWebhookFor(user.username, repo.name, check, user.accessToken),
          checkHandler.onCreateCheck(repo.id, checkType)
        ])
      }
      return Promise.resolve()
    }))
  }

  /**
   * Executes hook triggered by github.
   *
   * @param  {object} payload
   * @return {json}
   */
  async onHandleHook(payload) {
    let {name, id, owner} = payload.repository
    let config = await this.github.readZapprFile(owner.login, name)
    let repo = await repositoryHandler.onGetOne(id)
    let checks = repo.checks.map(c => c.type)
    // read config to see which checks are enabled
    if (checks.indexOf(Approval.type) >= 0) {
      log(`Executing approval hook for ${owner.login}/${name}`)
      Approval.execute(config, payload)
    }
    return '"THANKS"'
  }
}

export const hookHandler = new HookHandler()
