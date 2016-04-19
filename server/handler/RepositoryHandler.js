import GithubService from '../service/GithubService'
import { db, Repository, UserRepository, Check } from '../model'
import { logger } from '../../common/debug'

const info = logger('repo-handler', 'info')
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
   * @param {boolean} includeToken
   * @returns {Promise.<Object|null>}
   */
  onGetOne(id, user = null, includeToken = false) {
    if (user) {
      return Repository.userScope(user).findById(id, {
        include: [{
          model: Check,
          attributes: {exclude: includeToken ? [] : ['token']}
        }]
      })
    }
    return Repository.findById(id, {
      include: [{
        model: Check,
        attributes: {exclude: includeToken ? [] : ['token']}
      }]
    })
  }

  upsertRepos(db, user, remoteRepos) {
    return db.transaction(t =>
      Promise.all(
        remoteRepos.map(async(remoteRepo) => {
          const [repo] = await Repository.findOrCreate({
            where: {id: remoteRepo.id},
            defaults: {
              id: remoteRepo.id,
              json: remoteRepo
            },
            transaction: t
          })
          // HACK: workaround for https://github.com/sequelize/sequelize/issues/3220
          await UserRepository.findOrCreate({
            where: {
              userId: user.id,
              repositoryId: repo.id
            },
            defaults: {
              userId: user.id,
              repositoryId: repo.id
            },
            transaction: t
          })
        })
      )
    )
  }

  /**
   * Loads the repositories of a user.
   * (Re)loads repositories from Github if necessary and updates the database.
   *
   * @param {Object} user - Current user object
   * @param {Boolean} [loadAll = false] - (Re)load all available repositories from Github
   * @param {Boolean} [includeToken = false] - Include the Github access token in the returned data
   * @returns {Promise<Array.<Repository>>}
   */
  async onGetAll(user, loadAll = false, includeToken = false) {
    debug('Load repos from database...')
    const repos = await Repository.userScope(user).findAllSorted({
      include: [{
        model: Check,
        attributes: {exclude: includeToken ? [] : ['token']}
      }]
    })

    // No need to (re)load from Github. Return repositories from database.
    if (repos.length > 0 && !loadAll) return repos

    const pages = await this.githubService.fetchRepos(user.accessToken, loadAll)
    await this.upsertRepos(db, user, pages)
    info(`${user.username}: Loaded ${loadAll ? 'all' : 'some'} repos from Github`)

    // The previously merged repos are not sorted correctly
    // so we need to load them from the database again.
    return Repository.userScope(user).findAllSorted({
      include: [{
        model: Check,
        attributes: {exclude: includeToken ? [] : ['token']}
      }]
    })
  }
}

export const repositoryHandler = new RepositoryHandler()
