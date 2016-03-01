import yaml from 'js-yaml'
import nconf from '../nconf'
import {request} from '../../common/util'
import { logger } from '../../common/debug'

const log = logger('github')
const CLIENT_ID = nconf.get('GITHUB_CLIENT_ID')
const CLIENT_SECRET = nconf.get('GITHUB_CLIENT_SECRET')
const HOOK_PATH = '/repos/${owner}/${repo}/hooks'
const STATUS_PATH = '/repos/${owner}/${repo}/statuses/${sha}'
const ZAPPR_FILE_REPO_PATH = '/repos/${owner}/${repo}/contents' + nconf.get('ZAPPR_FILE_PATH')

export default class GithubService {

  getOptions(method, path, body, accessToken) {
    let url = nconf.get('GITHUB_URL') + path
    if (!accessToken) {
      // if there is no access token we add client id and secret
      // to the request
      url += `?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    }
    return {
      json: true,
      method: method,
      url,
      headers: {
        'User-Agent': 'ZAPPR/1.0 (+https://zappr.hackweek.zalan.do)',
        'Authorization': accessToken ? `token ${accessToken}` : undefined
      },
      body: body
    }
  }

  async fetchPath(method, path, payload, accessToken) {
    const options = this.getOptions(method, path, payload, accessToken)
    const [response, body] = await request(options)
    const {statusCode} = response || {}

    if ([200, 201, 202, 203, 204].indexOf(statusCode) < 0) {
      log(response.body)
      throw new Error(statusCode)
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
    log(`updating webhook for ${user}/${repo}`)
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
        log(`updating existing hook ${existing.id}`)
        return this.fetchPath('PATCH', path, payload, accessToken)
      } else {
        log(`deleting webhook ${existing.id}`)
        return this.fetchPath('DELETE', path)
      }
    } else {
      log('creating new hook')
      return this.fetchPath('POST', path, payload, accessToken)
    }
  }

  fetchRepos(accessToken) {
    return this.fetchPath('GET', '/user/repos', null, accessToken)
  }
}
