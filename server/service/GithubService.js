import yaml from 'js-yaml'
import nconf from '../nconf'
import { request } from '../../common/util'
import { logger } from '../../common/debug'

const debug = logger('github')
const info = logger('github', 'info')
const error = logger('github', 'error')

const HOOK_PATH = '/repos/${owner}/${repo}/hooks'
const PR_PATH = '/repos/${owner}/${repo}/pulls/${number}'
const ORG_MEMBER_PATH = '/orgs/${org}/public_members/${user}'
const STATUS_PATH = '/repos/${owner}/${repo}/statuses/${sha}'
const COMMENT_PATH = '/repos/${owner}/${repo}/issues/${number}/comments'
const COLLABORATOR_PATH = '/repos/${owner}/${repo}/collaborators/${user}'
const ZAPPR_FILE_REPO_PATH = '/repos/${owner}/${repo}/contents' + nconf.get('ZAPPR_FILE_PATH')

export default class GithubService {

  getOptions(method, path, body, accessToken) {
    let url = nconf.get('GITHUB_URL') + path

    return {
      json: true,
      method: method,
      url,
      headers: {
        'User-Agent': 'ZAPPR/1.0 (+https://zappr.hackweek.zalan.do)',
        'Authorization': `token ${accessToken}`
      },
      body: body
    }
  }

  async fetchPath(method, path, payload, accessToken) {
    const options = this.getOptions(method, path, payload, accessToken)
    const [response, body] = await request(options)
    const {statusCode} = response || {}

    // 300 codes are for github membership checks
    if ([200, 201, 202, 203, 204, 300, 301, 302].indexOf(statusCode) < 0) {
      error(statusCode, method, path, response.body, options)
      throw new Error(response.body ? response.body.message : statusCode)
    }
    else return body
  }

  setCommitStatus(user, repo, sha, status, accessToken) {
    let path = STATUS_PATH
                .replace('${owner}', user)
                .replace('${repo}', repo)
                .replace('${sha}', sha)
    return this.fetchPath('POST', path, status, accessToken)
  }

  async isCollaborator(owner, repo, user, accessToken) {
    let path = COLLABORATOR_PATH
                .replace('${owner}', owner)
                .replace('${repo}', repo)
                .replace('${user}', user)
    try {
      await this.fetchPath('GET', path, null, accessToken)
      return true
    } catch(e) {
      return false
    }
  }

  async isMemberOfOrg(org, user, accessToken) {
    let path = ORG_MEMBER_PATH
                .replace('${org}', org)
                .replace('${user}', user)
    try {
      await this.fetchPath('GET', path, null, accessToken)
      return true
    } catch(e) {
      return false
    }
  }

  getComments(user, repo, number, since, accessToken) {
    let path = COMMENT_PATH
                  .replace('${owner}', user)
                  .replace('${repo}', repo)
                  .replace('${number}', number)
    if (since) {
      path += `?since=${since}`
    }
    return this.fetchPath('GET', path, null, accessToken)
  }

  async getPullRequest(user, repo, number, accessToken) {
    const path = PR_PATH
                  .replace('${owner}', user)
                  .replace('${repo}', repo)
                  .replace('${number}', number)
    try {
      const pr = await this.fetchPath('GET', path, null, accessToken)
      debug(`${user}/${repo}:${number} is a pull request`)
      return pr
    } catch(e) {
      debug(`${user}/${repo}:${number} is NOT a pull request`)
      return false
    }
  }

  async readZapprFile(user, repo, accessToken) {
    // fetch file info
    const path = ZAPPR_FILE_REPO_PATH.replace('${owner}', user).replace('${repo}', repo)
    let {content} = await this.fetchPath('GET', path, null, accessToken)
    // short circuit if there is no such file
    if (!content) {
      return {}
    }
    // decode file content
    let file = Buffer(content, 'base64').toString('utf8')
    return yaml.safeLoad(file)
  }

  async updateWebhookFor(user, repo, events, accessToken) {
    debug(`${user}/${repo}: updating webhook with events: ${events.join(", ")}`)
    let path = HOOK_PATH.replace('${owner}', user).replace('${repo}', repo)
    let hook_url = nconf.get('HOST_ADDR') + '/api/hook'
    // payload for hook
    let payload = {
      name: 'web',
      active: true,
      events,
      config: {
        url: hook_url,
        content_type: 'json'
      }
    }
    // check if it's there already
    let hooks = await this.fetchPath('GET', path, null, accessToken)
    let existing = hooks.find(h => h.config.url === hook_url)
    if (!!existing) {
      path += `/${existing.id}`
      if (payload.events.length) {
        await this.fetchPath('PATCH', path, payload, accessToken)
        info(`${user}/${repo}: updated existing webhook ${existing.id}`)
      } else {
        await this.fetchPath('DELETE', path, null, accessToken)
        info(`${user}/${repo}: deleted existing webhook ${existing.id}`)
      }
    } else {
      await this.fetchPath('POST', path, payload, accessToken)
      info(`${user}/${repo}: created new webhook`)
    }
  }

  fetchRepos(accessToken) {
    return this.fetchPath('GET', '/user/repos', null, accessToken)
  }
}
