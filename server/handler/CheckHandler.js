import CheckHandlerError, { CHECK_NOT_FOUND, CHECK_EXISTS, DATABASE_ERROR } from './CheckHandlerError'
import { Check } from '../model'
import { githubService } from '../service/GithubService'
import { getCheckByType } from '../checks'
import { logger } from "../../common/debug"

const info = logger('check-handler', 'info')
const debug = logger('check-handler')

/**
 * @param {Array.<String>} types - Zappr check types
 * @returns {Array.<String>} Github event names
 */
function findHookEventsFor(types) {
  return types.map(type => {
                const check = getCheckByType(type)
                if (!check) throw new CheckHandlerError(CHECK_NOT_FOUND, {type})
                return check.HOOK_EVENTS
              })
              .reduce((arr, evts) => arr.concat(evts), [])         // flatten
              .filter((evt, i, arr) => i === arr.lastIndexOf(evt)) // deduplicate
}

class CheckHandler {
  constructor(github = githubService) {
    this.github = github
  }

  /**
   * @param {Number} repoId - Repository ID
   * @param {String} type - Check type
   * @param {String} user - The user who enabled it
   * @param {String} token - Authentication token
   * @returns {Promise.<Check>}
   * @throws {CheckHandlerError}
   */
  async onCreateCheck(repoId, type, user, token) {
    debug(`create check ${type} for repo ${repoId} w/ token ${token ? token.substr(0, 4) : 'NONE'} by user ${user}`)
    try {
      return await Check.create({
        repositoryId: repoId,
        type,
        token,
        created_by: user,
        arguments: {}
      }, {
        attributes: {exclude: ['token']}
      })
    } catch (e) {
      throw new CheckHandlerError(CHECK_EXISTS, {type, repository: repoId})
    }
  }

  onRefreshTokens(repoIds, token) {
    // noop for now
    // implement this when we fucked up
    return Promise.resolve()
  }

  /**
   * @param {Number} repoId - Repository ID
   * @param {String} type - Check type
   * @returns {Promise.<Check>}
   * @throws {CheckHandlerError}
   */
  async onGetOne(repoId, type) {
    debug(`find Check ${type} for repo ${repoId}`)
    let check
    try {
      check = await Check.findOne({
        where: {
          repositoryId: repoId,
          type
        }
      })
    } catch (e) {
      throw new CheckHandlerError(DATABASE_ERROR, {type, repository: repoId})
    }
    if (!check) throw new CheckHandlerError(CHECK_NOT_FOUND, {type, repository: repoId})
    return check
  }

  /**
   * @param {Number} repoId - Repository ID
   * @param {String} type - Check type
   * @returns {Promise.<Number>} - Number of destroyed rows
   * @throws {CheckHandlerError}
   */
  async onDeleteCheck(repoId, type) {
    debug(`delete check ${type} for repo ${repoId}`)
    let check
    try {
      await Check.destroy({
        where: {
          repositoryId: repoId,
          type
        }
      })
    } catch (e) {
      throw new CheckHandlerError(DATABASE_ERROR, {type, repository: repoId})
    }
  }

  /**
   * @param {object} user - Current user
   * @param {Repository} repository - Repository to enable Check for
   * @param {String} type - Check type
   * @returns {Promise.<Check>}
   * @throws {CheckHandlerError}
   */
  async onEnableCheck(user, repository, type) {
    const repo = repository.get('json')
    const types = [type, ...repository.checks.map(c => c.type)]
    const events = findHookEventsFor(types)
    // TODO: could use a database constraint instead?
    let existingCheck
    try {
      existingCheck = await checkHandler.onGetOne(repo.id, type)
    } catch (e) {
      // Expect check not to exist
    }
    if (existingCheck) throw new CheckHandlerError(CHECK_EXISTS, {type, repository: repo.id})

    await this.github.updateWebhookFor(repo.owner.login, repo.name, events, user.accessToken)
    const check = await checkHandler.onCreateCheck(repo.id, type, user.json.login, user.accessToken)
    info(`${repo.full_name}: enabled check ${type}`)
    return check
  }

  /**
   * @param {object} user - Current user
   * @param {Repository} repository - Repository to disable Check for
   * @param {String} type - Check type
   * @returns {Promise}
   * @throws {CheckHandlerError}
   */
  async onDisableCheck(user, repository, type) {
    const repo = repository.get('json')
    const types = repository.checks.map(c => c.type).filter(t => t !== type)
    const evts = findHookEventsFor(types)

    await this.github.updateWebhookFor(repo.owner.login, repo.name, evts, user.accessToken)
    await checkHandler.onDeleteCheck(repo.id, type)
    info(`${repo.full_name}: disabled check ${type}`)
  }
}

export const checkHandler = new CheckHandler()
