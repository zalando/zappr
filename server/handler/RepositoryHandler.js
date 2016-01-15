import RepositoryService from '../service/RepositoryService'
import GithubService from '../service/GithubService'

import { logger } from '../../common/debug'
const log = logger('RepositoryHandler')

class RepositoryHandler {
  constructor(repositoryService = new RepositoryService(), githubService = new GithubService()) {
    this.repositoryService = repositoryService
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
    const repo = await this.repositoryService.findOne(id, user.id, false)
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
    return this.repositoryService.findOne(id, user.id)
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
    const localRepos = await this.repositoryService.findAll(user.id, false)

    if (localRepos.length > 0 && !refresh) {
      return localRepos.map(repo => repo.flatten())
    }

    log('refresh repositories from Github API...')
    const remoteRepos = await this.githubService.fetchRepos(user.accessToken)

    let mergedRepos = remoteRepos.map(remoteRepo => {
      let repo = localRepos.find(localRepo => localRepo.id === remoteRepo.id)
      if (!repo) repo = RepositoryService.build(remoteRepo.id, user.id)
      repo.set('json', remoteRepo)
      return repo
    })

    log('update repositories in database...')
    mergedRepos = await Promise.all(mergedRepos.map(repo => repo.save()))

    return mergedRepos.map(repo => repo.flatten())
  }
}

export const repositoryHandler = new RepositoryHandler()
