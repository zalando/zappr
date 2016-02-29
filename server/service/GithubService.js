import yaml from 'js-yaml'
import {request} from '../../common/util'
import nconf from '../nconf'

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

    if (statusCode !== 200) throw new Error(statusCode)
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

  updateWebhookFor(user, repo, check, accessToken=TOKEN) {
    const path = HOOK_PATH.replace('${owner}', user).replace('${repo}', repo)
    // payload for hook
    payload = {
      name: 'zappr',
      active: true,
      config: {
        url: nconf.get(HOST_ADDR) + '/api/hook',
        content_type: 'json'
      }
    }
    // check if it's there already
    let hooks = this.fetchPath('GET', path)
    let existing = hooks.find(h => h.name === 'zappr')
    if (!!existing) {
      path += `/${existing.id}`
      payload.add_events = check.hookEvents
      return this.fetchPath('PATCH', path, payload, accessToken)
    } else {
      payload.events = check.hookEvents
      return this.fetchPath('POST', path, payload, accessToken)
    }
  }

  fetchRepos(accessToken=TOKEN) {
    return this.fetchPath('GET', '/user/repos', accessToken)
  }
}
