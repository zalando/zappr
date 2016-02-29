import { Approval } from '../checks'
import { logger } from '../../common/debug'
import { checkHandler } from './CheckHandler'
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
    let {name} = payload.repository
    let user = payload.repository.owner.login
    let config = await this.github.readZapprFile(user, name)
    // read config to see which checks are enabled
    if (config.approvals) {
      log(`Executing approval hook for ${user}/${name}`)
      Approval.execute(config, payload)
    }
    return '"THANKS"'
  }
}

export const hookHandler = new HookHandler()
