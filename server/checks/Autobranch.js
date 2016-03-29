import { logger } from '../../common/debug'

const info = logger('autobranch', 'info')
const error = logger('autobranch', 'error')

function safeArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return ''
  }
  return arr.map(safeString).join('-')
}

function safeString(str) {
  return str
          // drop everything from title that is not ascii
          .replace(/[^a-zA-Z0-9\s]+/gu, '')
          // make it lowercase
          .toLowerCase()
          // replace whitespaces with dashes
          .split(' ')
          .filter(x => x.length > 0)
          .join('-')
}

export default class Autobranch {
  static get type() {
    return 'autobranch'
  }

  static get hookEvents() {
    return ['issues']
  }

  static createBranchNameFromIssue({number, title, labels}, {length = 60, pattern = '{number}-{title}'}) {
    return pattern
            .replace('{number}', number)
            .replace('{title}', safeString(title))
            .replace('{labels}', safeArray(labels.map(l => l.name)))
            .substring(0, length)
  }

  static async execute(github, config, hookPayload, token) {
    const {action, issue, repository} = hookPayload
    // only interested in open events right now
    if (action !== 'opened') {
      info(`${repository.full_name}: Ignoring issue because action not "opened" (${action}).`)
      return
    }
    try {
      const owner = repository.owner.login
      const repo = repository.name
      const branchName = this.createBranchNameFromIssue(issue, config.autobranch)
      const {sha} = await github.getHead(owner, repo, repository.default_branch, token)
      // branch could exist already
      await github.createBranch(owner, repo, branchName, sha, token)
      info(`Created branch ${branchName} for ${sha} in ${repository.full_name}`)
    } catch(e) {
      // but we don't care
      error(`Could not create branch ${branchName} for ${sha} in ${repository.full_name}`, e)
    }
  }
}
