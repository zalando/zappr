import yaml from 'js-yaml'
import request from 'request'
import nconf from '../nconf'

const ZAPPR_FILE_REPO_PATH = '/repos/${owner}/${repo}/contents' + nconf.get('ZAPPR_FILE_PATH')

export default class GithubService {

  request(...args) {
    return new Promise((resolve, reject) => {
      request(...args, (err, ...rest) => {
        if (err) reject(err)
        else resolve(rest)
      })
    })
  }

  getOptions(method, path, accessToken, body) {
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

  async fetchPath(method, path, accessToken, payload) {
    const options = this.getOptions(method, path, accessToken, payload)
    const [response, body] = await this.request(options)
    const {statusCode} = response || {}

    if (statusCode !== 200) throw new Error(statusCode)
    else return body
  }

  async readZapprFile(user, repo, accessToken) {
    // fetch file info
    const path = ZAPPR_FILE_REPO_PATH.replace('${owner}', user).replace('${repo}', repo)
    let {content} = await this.fetchPath('GET', path, accessToken)
    // decode file content
    let file = Buffer(content, 'base64').toString('utf8')
    return yaml.safeLoad(file)
  }

  fetchRepos(accessToken) {
    return this.fetchPath('GET', '/user/repos', accessToken)
  }
}
