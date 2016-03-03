import GithubService from '../service/GithubService'
import Approval from '../checks/Approval'
import { db, Repository, Check } from '../model'
import { checkHandler } from './CheckHandler'
import { logger } from '../../common/debug'

const debug = logger('repo-handler')

class RepositoryHandler {
  constructor(githubService = new GithubService()) {
    this.githubService = githubService
  }

  /**
   * Load one repository of a user if it exists in the local database.
   *
   * @param {Number} id - Id of the repository
   * @param {Object} user - Current user object
   * @returns {Promise.<Object|null>}
   */
  onGetOne(id, user) {
    if (user) {
      return Repository.userScope(user).findById(id, {include: [Check]})
    }
    return Repository.findById(id, {include: [Check]})
  }

  /**
   * Load all repositories of a user.
   * Fetch and save repositories from Github if necessary.
   *
   * @param {Object} user - Current user object
   * @param {Boolean} [refresh = false] - Force reloading from Github
   * @returns {Promise<Array.<Object>>}
   */
  async onGetAll(user, refresh = false) {
    if (!refresh) {
      const repos = await Repository.userScope(user).findAllSorted({include: [Check]})
      if (repos.length > 0) {
        return repos.map(repo => repo.flatten())
      }
    }

    debug('refresh repositories from Github API...')
    const remoteRepos = await this.githubService.fetchRepos(user.accessToken)

    await db.transaction(t => {
      return Promise.all(remoteRepos.map(remoteRepo =>
        Repository.findOrCreate({
          where: {id: remoteRepo.id},
          defaults: {
            token: user.accessToken,  // !!!! :(
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
