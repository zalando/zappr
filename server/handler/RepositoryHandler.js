import RepositoryHandlerError, { REPOSITORY_NOT_FOUND, DATABASE_ERROR } from './RepositoryHandlerError'
import { githubService } from '../service/GithubService'
import { db, Repository, UserRepository, Check } from '../model'
import { logger } from '../../common/debug'
import { setDifference } from '../../common/util'

const debug = logger('repo-handler')

class RepositoryHandler {
  constructor(github = githubService) {
    this.github = github
  }

  onWelcome(id) {
    debug(`welcome repository ${id}!`)
    return Repository.findById(id).then(repo => repo.update({welcomed: true}))
  }

  /**
   * Load one repository of a user if it exists in the local database.
   * If autoSync is true, then fetch the repo from GitHub and update the database.
   *
   * @param {Number} id - Id of the repository
   * @param {Object} user - Current user object
   * @param {boolean} includeToken
   * @returns {Promise.<Object|null>}
   * @throws RepositoryHandlerError
   */
  async onGetOne(id, user = null, includeToken = false, autoSync = false) {
    debug(`get Repository ${id}, autoSync ${autoSync}`)
    let repository
    try {
      if (user) {
        repository = await Repository.userScope(user).findById(id, {
          include: [{
            model: Check,
            attributes: {exclude: includeToken ? [] : ['token']}
          }]
        })
        if (!repository && autoSync) {
          repository = await this.github.fetchRepoById(user.accessToken, id)
          if (repository)
            await db.transaction(t => this.upsertRepos(t, user.id, [repository]))
        }
      } else {
        repository = await Repository.findById(id, {
          include: [{
            model: Check,
            attributes: {exclude: includeToken ? [] : ['token']}
          }]
        })
      }
    } catch (e) {
      throw new RepositoryHandlerError(DATABASE_ERROR)
    }
    if (!repository) throw new RepositoryHandlerError(REPOSITORY_NOT_FOUND, {repository: id})
    return repository
  }

  /**
   * Inserts or updates repositories for this user.
   *
   * @param transaction The database transaction to use
   * @param userId The id of the user
   * @param remoteRepos The repositories from Github API
   * @returns {Promise}
   */
  upsertRepos(transaction, userId, remoteRepos) {
    return Promise.all(
      remoteRepos.map(async(remoteRepo) => {
        const repositoryId = remoteRepo.id
        await Repository.upsert({
          id: repositoryId,
          json: remoteRepo
        }, {
          transaction
        })
        // HACK: workaround for https://github.com/sequelize/sequelize/issues/3220
        await UserRepository.findOrCreate({
          where: {
            userId,
            repositoryId
          },
          defaults: {
            userId,
            repositoryId
          },
          transaction
        })
      })
    )
  }

  /**
   * Removes repositories from the database that are not included
   * in repositories from the Github API.
   *
   * @param transaction The database transaction to use
   * @param user The user
   * @param remoteRepos The repositories from the Github API
   * @returns {Promise}
   */
  async removeMissingRepos(transaction, user, remoteRepos) {
    const dbRepos = await Repository.userScope(user).findAll()
    // find dbRepos that are not in remoteRepos
    const dbIds = new Set(dbRepos.map(r => r.id))
    const remoteIds = new Set(remoteRepos.map(r => r.id))
    const diff = setDifference(dbIds, remoteIds)
    return Promise.all([...diff].map(repoId =>
      UserRepository
      .find({
        where: {
          repositoryId: repoId,
          userId: user.id
        }
      }, {
        transaction
      })
      .then(dbRepo => dbRepo.destroy({transaction}))
    ))
  }

  /**
   * Updates repositories of this user in the database, e.g. adds, updates or removes.
   *
   * @param db The database
   * @param user The user
   * @param remoteRepos Repositories from Github
   * @returns {Promise}
   */
  updateRepos(db, user, remoteRepos) {
    return db.transaction(t => Promise.all([
      this.upsertRepos(t, user.id, remoteRepos),
      this.removeMissingRepos(t, user, remoteRepos)
    ]))
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
    debug('Load repositories for user %s from database', user.json.username)
    let repos = await Repository.userScope(user).findAllSorted({
      include: [{
        model: Check,
        attributes: {exclude: includeToken ? [] : ['token']}
      }]
    })
    debug('Loaded %d repositories for user %s from database', repos.length, user.json.username)

    // No need to (re)load from Github. Return repositories from database.
    if (repos.length > 0 && !loadAll) return repos

    repos = await this.github.fetchRepos(user.accessToken, loadAll)
    await this.updateRepos(db, user, repos)
    debug(`Loaded ${loadAll ? 'all' : 'some'} repos for user ${user.json.username} from Github`)

    // The previously merged repos are not sorted correctly
    // so we need to load them from the database again.
    return await Repository.userScope(user).findAllSorted({
      include: [{
        model: Check,
        attributes: {exclude: includeToken ? [] : ['token']}
      }]
    })
  }
}

export const repositoryHandler = new RepositoryHandler()
