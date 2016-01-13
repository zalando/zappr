import { Repository } from '../model'

export default class RepositoryService {

  findAll() {
    return Repository.findAll().
    then(repos => repos.map(repo => ({
      id: repo.id,
      ...JSON.parse(repo.get('json'))
    })))
  }

  upsert(repo) {
    const {id, ...repoData} = repo
    return Repository.upsert({
      id,
      json: repoData
    })
  }

  upsertAll(repos) {
    return Promise.all(repos.map(this.upsert))
  }
}
