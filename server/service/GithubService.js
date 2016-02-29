import yaml from 'js-yaml'
import nconf from '../nconf'
import {request} from '../../common/util'
import { logger } from '../../common/debug'

const log = logger('github')
const TOKEN = nconf.get('GITHUB_ACCESS_TOKEN')
const HOOK_PATH = '/repos/${owner}/${repo}/hooks'
const ZAPPR_FILE_REPO_PATH = '/repos/${owner}/${repo}/contents' + nconf.get('ZAPPR_FILE_PATH')

export default class GithubService {

  getOptions(method, path, body, accessToken=TOKEN) {
    return {
      json: true,
      method: method,
      url: nconf.get('GITHUB_URL') + path,
      headers: {
        'User-Agent': 'ZAPPR/1.0 (+https://zappr.hackweek.zalan.do)',
        'Authorization': `token ${accessToken}`
      },
      body: body
    }
  }

  async fetchPath(method, path, payload, accessToken=TOKEN) {
    const options = this.getOptions(method, path, payload, accessToken)
    const [response, body] = await request(options)
    const {statusCode} = response || {}

    if ([200, 201, 202, 203, 204].indexOf(statusCode) < 0) {
      log(response.body)
      throw new Error(statusCode)
    }
    else return body
  }

  async readZapprFile(user, repo, accessToken=TOKEN) {
    // fetch file info
    const path = ZAPPR_FILE_REPO_PATH.replace('${owner}', user).replace('${repo}', repo)
    let {content} = await this.fetchPath('GET', path, accessToken)
    // short circuit if there is no such file
    if (!content) {
      return {}
    }
    // decode file content
    let file = Buffer(content, 'base64').toString('utf8')
    return yaml.safeLoad(file)
  }

  async updateWebhookFor(user, repo, check, accessToken=TOKEN) {
    log(`updating webhook for ${check.type} in ${user}/${repo}`)
    let path = HOOK_PATH.replace('${owner}', user).replace('${repo}', repo)
    let hook_url = nconf.get('HOST_ADDR') + '/api/hook'
    // payload for hook
    let payload = {
      name: 'web',
      active: true,
      config: {
        url: hook_url,
        content_type: 'json'
      }
    }
    // check if it's there already
    let hooks = await this.fetchPath('GET', path)
    let existing = hooks.find(h => h.config.url === hook_url)
    if (!!existing) {
      log(`updating existing hook ${existing.id}`)
      path += `/${existing.id}`
      payload.add_events = check.hookEvents
      return this.fetchPath('PATCH', path, payload, accessToken)
    } else {
      log('creating new hook')
      payload.events = check.hookEvents
      return this.fetchPath('POST', path, payload, accessToken)
    }
  }

  fetchRepos(accessToken=TOKEN) {
    return this.fetchPath('GET', '/user/repos', accessToken)
  }
}
