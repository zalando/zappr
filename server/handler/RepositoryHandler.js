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
        attributes: {exclude: includeToken ? [] : ['hookSecret']}
        include: [{
          model: Check,
          attributes: {exclude: includeToken ? [] : ['token']}
        }]
      })
    }
    return Repository.findById(id, {
      attributes: {exclude: includeToken ? [] : ['hookSecret']}
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
   * Load all repositories of a user.
   * Fetch and save repositories from Github if necessary.
   *
   * @param {Object} user - Current user object
   * @param {Boolean} [refresh = false] - Force reloading from Github
   * @returns {Promise<Array.<Object>>}
   */
  async onGetAll(user, all = false, includeToken = false) {
    // load repos
    // if no repos, fetch first page, save and return
    // if repos and all=false, return repos
    // if repos and all=true, fetch all from github, save and return

    debug('load repositories from database...')
    const repos = await Repository.userScope(user).findAllSorted({
      include: [{
        model: Check,
        attributes: {exclude: includeToken ? [] : ['token']}
      }]
    })
    if (repos.length === 0) {
      const firstPage = await this.githubService.fetchRepos(0, false, user.accessToken)
      info(`${user.username}: Loaded first page from Github`)
      await this.upsertRepos(db, user, firstPage)
    } else if (all) {
      const allPages = await this.githubService.fetchRepos(0, true, user.accessToken)
      info(`${user.username}: Reloaded from Github`)
      await this.upsertRepos(db, user, allPages)
    } else {
      return repos.map(repo => repo.flatten())
    }

    // The previously merged repos are not sorted correctly
    // so we need to load them from the database again.
    return Repository.userScope(user).
      findAllSorted({
        include: [{
          model: Check,
          attributes: {exclude: includeToken ? [] : ['token']}
        }]
      }).
      then(repos => repos.map(repo => repo.flatten()))
  }
}

export const repositoryHandler = new RepositoryHandler()
