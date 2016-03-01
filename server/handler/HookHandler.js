import { Approval } from '../checks'
import { logger } from '../../common/debug'
import { checkHandler } from './CheckHandler'
import { repositoryHandler } from './RepositoryHandler'
import { getCheckByType } from '../checks'
import { db, Repository, Check } from '../model'
import GithubService from '../service/GithubService'

const log = logger('hook')

function findHookEventsFor(types) {
  return types
          .map(getCheckByType)
          .map(c => c.hookEvents)
          // flatten
          .reduce((arr, evts) => {
            Array.prototype.push.apply(arr, evts)
            return arr
          }, [])
          // deduplicate
          .filter((evt, i, arr) => i === arr.lastIndexOf(evt))
}

class HookHandler {
  constructor(github = new GithubService()) {
    this.github = github
  }

  async onEnableCheck(user, repository, type) {
    let repo = repository.get('json')
    let types = repository.checks.map(c => c.type)
    types.push(type)
    let evts = findHookEventsFor(types)

    await checkHandler.onCreateCheck(repo.id, type)
    return this.github.updateWebhookFor(user.username, repo.name, evts, user.accessToken)
  }

  async onDisableCheck(user, repository, type) {
    let repo = repository.get('json')
    let types = repository.checks.map(c => c.type).filter(t => t !== type)
    let evts = findHookEventsFor(types)

    await checkHandler.onDeleteCheck(repo.id, type)
    return this.github.updateWebhookFor(user.username, repo.name, evts, user.accessToken)
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
