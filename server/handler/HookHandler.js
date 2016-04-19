import merge from 'lodash/merge'

import GithubService from '../service/GithubService'
import nconf from '../nconf'
import { Approval, Autobranch, CommitMessage } from '../checks'
import { logger } from '../../common/debug'
import { checkHandler } from './CheckHandler'
import { repositoryHandler } from './RepositoryHandler'
import { pullRequestHandler } from './PullRequestHandler'
import { getCheckByType } from '../checks'

const info = logger('hook', 'info')
const DEFAULT_CONFIG = nconf.get('ZAPPR_DEFAULT_CONFIG')

/**
 * @param {Array.<string>} types - Zappr check types
 * @returns {Array.<string>} Github event names
 */
function findHookEventsFor(types) {
  return types.map(getCheckByType)
              .map(c => c.HOOK_EVENTS)
              .reduce((arr, evts) => { // flatten
                Array.prototype.push.apply(arr, evts)
                return arr
              }, [])
              .filter((evt, i, arr) => i === arr.lastIndexOf(evt)) // deduplicate
}

class HookHandler {
  constructor(github = new GithubService()) {
    this.github = github
  }

  // TODO: should be part of CheckHandler as this is only called via the Zappr API
  async onEnableCheck(user, repository, type) {
    const repo = repository.get('json')
    const types = [type, ...repository.checks.map(c => c.type)]
    const events = findHookEventsFor(types)

    // TODO: could use a database constraint instead?
    const existingCheck = await checkHandler.onGetOne(repo.id, type)
    if (existingCheck) throw new Error(`Check ${type} already exists for repo ${repo.id}`, 409)

    await this.github.updateWebhookFor(repo.owner.login, repo.name, events, user.accessToken)
    const check = await checkHandler.onCreateCheck(repo.id, type, user.accessToken)
    info(`${repo.full_name}: enabled check ${type}`)
    return check
  }

  // TODO: should be part of CheckHandler as this is only called via the Zappr API
  async onDisableCheck(user, repository, type) {
    const repo = repository.get('json')
    const types = repository.checks.map(c => c.type).filter(t => t !== type)
    const evts = findHookEventsFor(types)

    await this.github.updateWebhookFor(repo.owner.login, repo.name, evts, user.accessToken)
    await checkHandler.onDeleteCheck(repo.id, type)
    info(`${repo.full_name}: disabled check ${type}`)
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

    const {name, id, owner} = payload.repository
    const repo = await repositoryHandler.onGetOne(id, null, true)
    const zapprUserConfig = repo.checks.length ?
      await this.github.readZapprFile(owner.login, name, repo.checks[0].token)
      : {}

    const config = merge({}, DEFAULT_CONFIG, zapprUserConfig)

    if (Approval.dependsOn(event)) {
      getToken(repo, Approval.TYPE).then(token =>
        Approval.execute(this.github, config, payload, token, repo.id, pullRequestHandler)
      )
    }
    if (Autobranch.dependsOn(event)) {
      getToken(repo, Autobranch.TYPE).then(token =>
        Autobranch.execute(this.github, config, payload, token)
      )
    }
    if (CommitMessage.dependsOn(event)) {
      getToken(repo, CommitMessage.TYPE).then(token =>
        CommitMessage.execute(this.github, config, payload, token)
      )
    }
    return {
      message: "THANKS"
    }
  }
}

export const hookHandler = new HookHandler()
