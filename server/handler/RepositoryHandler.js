import GithubService from '../service/GithubService'
import { sequelize, Repository } from '../model'

import { logger } from '../../common/debug'
const log = logger('RepositoryHandler')

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
    const repo = await Repository.findOne({where: {id, userId: user.id}})
    if (!repo) return Promise.reject(new Error(404))
    // Find a way to use JSONB with postgres.
    repo.set('json', {...repo.get('json'), zapprEnabled})
    return repo.save().then(repo => repo.flatten())
  }

  /**
   * Load one repository of a user if it exists in the local database.
   *
   * @param {Number} id - Id of the repository
   * @param {Object} user - Current user object
   * @returns {Promise.<Object|null>}
   */
  onGetOne(id, user) {
    return Repository.findOne({where: {id, userId: user.id}})
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
    log('load repositories from database...')
    const localRepos = await Repository.findAll({where: {userId: user.id}})

    if (localRepos.length > 0 && !refresh) {
      return localRepos.map(repo => repo.flatten())
    }

    log('refresh repositories from Github API...')
    const remoteRepos = await this.githubService.fetchRepos(user.accessToken)

    log('update repositories in database...')
    const mergedRepos = await sequelize.transaction(t => {
      return Promise.all(remoteRepos.map(remoteRepo =>
        Repository.findOrCreate({
          where: {id: remoteRepo.id},
          defaults: {
            userId: user.id,
            json: remoteRepo
          },
          transaction: t
        }).
        then(([localRepo]) => {
          localRepo.set('json', remoteRepo)
          return localRepo
        })
      ))
    })

    return mergedRepos.map(repo => repo.flatten())
  }
}

export const repositoryHandler = new RepositoryHandler()
