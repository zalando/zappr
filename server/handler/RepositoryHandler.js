import GithubService from '../service/GithubService'
import Approval from '../checks/Approval'
import { db, Repository, Check } from '../model'
import { checkHandler } from './CheckHandler'

import { logger } from '../../common/debug'
const log = logger('handler')

class RepositoryHandler {
  constructor(githubService = new GithubService()) {
    this.githubService = githubService
  }

  /**
   * TODO: implement check, hook and status logic
   * @deprecated Add or remove checks in the model
   * @param {Number} id - Id of the repository
   * @param {Object} user - Current user object
   * @param {Boolean} zapprEnabled
   * @returns {Promise.<Object>}
   */
  async onToggleZapprEnabled(id, user, zapprEnabled) {
    let repo = await Repository.userScope(user).findById(id)
    if (!repo) throw 404

    if (zapprEnabled) {
      const check = await checkHandler.onCreateCheck(id, Approval.type)
      repo = await check.getRepository({include: [Check]})
      return repo.flatten()
    } else {
      await checkHandler.onDeleteCheck(id, Approval.type)
      repo = await Repository.userScope(user).findById(id, {include: [Check]})
      return repo.flatten()
    }
  }

  /**
   * Load one repository of a user if it exists in the local database.
   *
   * @param {Number} id - Id of the repository
   * @param {Object} user - Current user object
   * @returns {Promise.<Object|null>}
   */
  onGetOne(id, user) {
    return Repository.userScope(user).findById(id)
  }

  /**
   * Load all repositories of a user.
   * Fetch and save repositories from Github if necessary.
   *
   * @param {Object} user - Current user object
   * @param {Boolean} [refresh = false] - Force reloading from Github
   * @returns {Promise<Array.<Object>>}
   */
  async onGetAll(user, refresh) {
    if (!refresh) {
      log('load repositories from database...')
      const repos = await Repository.userScope(user).findAllSorted({include: [Check]})
      if (repos.length > 0) {
        return repos.map(repo => repo.flatten())
      }
    }

    log('refresh repositories from Github API...')
    const remoteRepos = await this.githubService.fetchRepos(user.accessToken)

    log('update repositories in database...')
    await db.transaction(t => {
      return Promise.all(remoteRepos.map(remoteRepo =>
        Repository.findOrCreate({
          where: {id: remoteRepo.id},
          defaults: {
            userId: user.id,
            json: remoteRepo
          },
          transaction: t
        }).
        then(([localRepo]) => localRepo.update({
          json: {...localRepo.get('json'), ...remoteRepo}
        }, {
          transaction: t
        }))
      ))
    })

    // The previously merged repos are not sorted correctly
    // so we need to load them from the database again.
    return Repository.userScope(user).findAllSorted({include: [Check]})
      .then(repos => repos.map(repo => repo.flatten()))
  }
}

export const repositoryHandler = new RepositoryHandler()
