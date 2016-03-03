import yaml from 'js-yaml'
import nconf from '../nconf'
import { request } from '../../common/util'
import { logger } from '../../common/debug'

const log = logger('github')

const HOOK_PATH = '/repos/${owner}/${repo}/hooks'
const PR_PATH = '/repos/${owner}/${repo}/pulls/${number}'
const ORG_MEMBER_PATH = '/orgs/${org}/public_members/${user}'
const STATUS_PATH = '/repos/${owner}/${repo}/statuses/${sha}'
const COMMENT_PATH = '/repos/${owner}/${repo}/issues/${number}/comments'
const COLLABORATOR_PATH = '/repos/${owner}/${repo}/collaborators/${user}'
const ZAPPR_FILE_REPO_PATH = '/repos/${owner}/${repo}/contents' + nconf.get('ZAPPR_FILE_PATH')

function padLeading(digit, number, totalLength) {
  let strNumber = number.toString()
  if (strNumber.length >= totalLength) {
    return strNumber
  }
  let padding = totalLength - strNumber.length
  while(padding) {
    strNumber = digit + strNumber
    padding -= 1
  }
  return strNumber
}

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

  formatDate(date) {
    let year = date.getUTCFullYear()
    let month = date.getUTCMonth() + 1
    let day = date.getUTCDate()
    let hour = date.getUTCHours()
    let minute = date.getUTCMinutes()
    let second = date.getUTCSeconds()

    month = padLeading(0, month, 2)
    day = padLeading(0, day, 2)
    hour = padLeading(0, hour, 2)
    minute = padLeading(0, minute, 2)
    second = padLeading(0, second, 2)
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
  }

  async fetchPath(method, path, payload, accessToken) {
    const options = this.getOptions(method, path, payload, accessToken)
    const [response, body] = await request(options)
    const {statusCode} = response || {}

    // 300 codes are for github membership checks
    if ([200, 201, 202, 203, 204, 300, 301, 302].indexOf(statusCode) < 0) {
      log(statusCode, method, path, response.body, options)
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
      log(`${user}/${repo}:${number} is a pull request`)
      return pr
    } catch(e) {
      log(`${user}/${repo}:${number} is NOT a pull request`)
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
        return this.fetchPath('DELETE', path, null, accessToken)
      }
    } else {
      log('creating new hook')
      return this.fetchPath('POST', path, payload, accessToken)
    }
  }

  parseLinkHeader(header) {
    if (!header || !header.length) {
      return {}
    }
    return header
            .split(',')
            .map(link => link.trim())
            .map(link => link.match(/<(?:.+?)\?page=([0-9]+)(?:.+?)>; rel="([a-z]+)"/))
            .reduce((links, matches) => {
              if (!matches || matches.length !== 3) {
                return links
              }
              links[matches[2]] = parseInt(matches[1], 10)
              return links
            }, {})

  }

  async fetchRepoPage(page, accessToken) {
    let links = {}
    const [resp, body] = await request(this.getOptions('GET', `/user/repos?page=${page}&visibility=public`, null, accessToken))
    if (resp.headers && resp.headers.link) {
      links = this.parseLinkHeader(resp.headers.link)
    }
    return {body, links, page}
  }

  // loads from {{page}} to last page
  async fetchRepos(page = 0, loadAll = false, accessToken) {
    let repos = []
    var that = this
    const firstPage = await this.fetchRepoPage(page, accessToken)
    Array.prototype.push.apply(repos, firstPage.body)
    if (loadAll && firstPage.links.last > page) {
      const pageDefs = Array(firstPage.links.last - page).fill(0).map((p, i) => i + page + 1)
      const pages = await Promise.all(pageDefs.map(async (page) => await that.fetchRepoPage(page, accessToken)))
      pages.forEach(p => Array.prototype.push.apply(repos, p.body))
    }
    return repos
  }
}
