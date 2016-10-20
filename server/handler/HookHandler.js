import ZapprConfiguration from '../zapprfile/Configuration'
import { githubService as defaultGithubService } from '../service/GithubService'
import { repositoryHandler as defaultRepositoryHandler } from './RepositoryHandler'
import { checkRunner as defaultCheckRunner } from '../checks/CheckRunner'

class HookHandler {
  constructor(githubService = defaultGithubService,
              repositoryHandler = defaultRepositoryHandler,
              checkRunner = defaultCheckRunner) {
    this.checkRunner = checkRunner
    this.githubService = githubService
    this.repositoryHandler = repositoryHandler
  }

  /**
   * Executes hook triggered by Github.
   *
   * @param  {string} event
   * @param  {object} payload
   * @return {object}
   */
  async onHandleHook(event, payload) {
    if (payload.repository) {
      const {name, id, owner} = payload.repository
      const dbRepo = await this.repositoryHandler.onGetOne(id, null, true)
      let config = {}
      if (dbRepo.checks.length) {
        const zapprFileContent = await this.githubService.readZapprFile(owner.login, name, dbRepo.checks[0].token)
        const zapprfile = new ZapprConfiguration(zapprFileContent)
        config = zapprfile.getConfiguration()
        this.checkRunner.runAll(dbRepo, {event, payload, config})
      }
    }
    return {
      message: "THANKS"
    }
  }
}

export const hookHandler = new HookHandler()
