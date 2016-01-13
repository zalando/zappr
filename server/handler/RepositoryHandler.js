import RepositoryService from '../service/RepositoryService'
import GithubService from '../service/GithubService'

import { logger } from '../../common/debug'
const log = logger('RepositoryHandler')

class RepositoryHandler {
  constructor(repositoryService = new RepositoryService(), githubService = new GithubService()) {
    this.repositoryService = repositoryService
    this.githubService = githubService
  }

  async onGetAll(accessToken, refresh) {

    log('load repositories from database...')
    const localRepos = await this.repositoryService.findAll()

    if (localRepos.length > 0 && !refresh) {
      return localRepos
    }

    log('refresh repositories from Github API...')
    const remoteRepos = await this.githubService.fetchRepos(accessToken)

    const mergedRepos = remoteRepos.map(remoteRepo => ({
      ...localRepos.find(localRepo => localRepo.id === remoteRepo.id),
      ...remoteRepo
    }))

    log('update repositories in database...')
    await this.repositoryService.upsertAll(mergedRepos)

    return mergedRepos
  }
}

export const repositoryHandler = new RepositoryHandler()
