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

  upsertRepos(db, user, remoteRepos) {
    return db.transaction(t => {
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
  }

  /**
   * Load all repositories of a user.
   * Fetch and save repositories from Github if necessary.
   *
   * @param {Object} user - Current user object
   * @param {Boolean} [refresh = false] - Force reloading from Github
   * @returns {Promise<Array.<Object>>}
   */
  async onGetAll(user, all = false) {
    // load repos
    // if no repos, fetch first page, save and return
    // if repos and all=false, return repos
    // if repos and all=true, fetch all from github, save and return

    log('load repositories from database...')
    const repos = await Repository.userScope(user).findAllSorted({include: [Check]})
    if (repos.length === 0) {
      const firstPage = await this.githubService.fetchRepos(0, false, user.accessToken)
      await this.upsertRepos(db, user, firstPage)
    } else if (all) {
      const allPages = await this.githubService.fetchRepos(0, true, user.accessToken)
      await this.upsertRepos(db, user, allPages)
    } else {
      return repos.map(repo => repo.flatten())
    }

    // The previously merged repos are not sorted correctly
    // so we need to load them from the database again.
    return Repository
              .userScope(user)
              .findAllSorted({include: [Check]})
              .then(repos => repos.map(repo => repo.flatten()))
  }
}

export const repositoryHandler = new RepositoryHandler()
