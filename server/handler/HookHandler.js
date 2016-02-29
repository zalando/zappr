import { Approval } from '../checks'
import { logger } from '../../common/debug'
import GithubService from '../service/GithubService'

const log = logger('hook')

class HookHandler {
  constructor(github = new GithubService()) {
    this.github = github
  }

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
