import yaml from 'js-yaml'
import nconf from '../nconf'
import { request } from '../../common/util'
import { logger } from '../../common/debug'

const debug = logger('github')
const info = logger('github', 'info')
const error = logger('github', 'error')
const HOOK_SECRET = nconf.get('GITHUB_HOOK_SECRET')

const PATHS = {
  HOOK: '/repos/${owner}/${repo}/hooks',
  PR: '/repos/${owner}/${repo}/pulls/${number}',
  ORG_MEMBER: '/orgs/${org}/public_members/${user}',
  STATUS: '/repos/${owner}/${repo}/statuses/${sha}',
  COMMENT: '/repos/${owner}/${repo}/issues/${number}/comments',
  COLLABORATOR: '/repos/${owner}/${repo}/collaborators/${user}',
  ZAPPR_FILE_REPO: '/repos/${owner}/${repo}/contents' + nconf.get('ZAPPR_FILE_PATH'),
  REF: '/repos/${owner}/${repo}/git/refs/heads/${branch}',
  CREATE_REF: '/repos/${owner}/${repo}/git/refs',
  PR_COMMITS: '/repos/${owner}/${repo}/pulls/${number}/commits'
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

  async fetchPath(method, path, payload, accessToken) {
    const options = this.getOptions(method, path, payload, accessToken)
    const [response, body] = await request(options)
    const {statusCode} = response || {}

    // 300 codes are for github membership checks
    if ([200, 201, 202, 203, 204, 300, 301, 302].indexOf(statusCode) < 0) {
      error(`${statusCode} ${method} ${path}`, response.body)
      throw new Error(response.body ? response.body.message : statusCode)
    }
    else return body
  }

  setCommitStatus(user, repo, sha, status, accessToken) {
    let path = PATHS.STATUS
                    .replace('${owner}', user)
                    .replace('${repo}', repo)
                    .replace('${sha}', sha)
    return this.fetchPath('POST', path, status, accessToken)
  }

  async isCollaborator(owner, repo, user, accessToken) {
    let path = PATHS.COLLABORATOR
                    .replace('${owner}', owner)
                    .replace('${repo}', repo)
                    .replace('${user}', user)
    try {
      await this.fetchPath('GET', path, null, accessToken)
      return true
    } catch (e) {
      return false
    }
  }

  async isMemberOfOrg(org, user, accessToken) {
    let path = PATHS.ORG_MEMBER
                    .replace('${org}', org)
                    .replace('${user}', user)
    try {
      await this.fetchPath('GET', path, null, accessToken)
      return true
    } catch (e) {
      return false
    }
  }

  getComments(user, repo, number, since, accessToken) {
    let path = PATHS.COMMENT
                    .replace('${owner}', user)
                    .replace('${repo}', repo)
                    .replace('${number}', number)
    if (since) {
      path += `?since=${since}`
    }
    return this.fetchPath('GET', path, null, accessToken)
  }

  async getPullRequest(user, repo, number, accessToken) {
    const path = PATHS.PR
                      .replace('${owner}', user)
                      .replace('${repo}', repo)
                      .replace('${number}', number)
    try {
      const pr = await this.fetchPath('GET', path, null, accessToken)
      debug(`${user}/${repo}:${number} is a pull request`)
      return pr
    } catch (e) {
      debug(`${user}/${repo}:${number} is NOT a pull request`)
      return false
    }
  }

  async getHead(owner, repo, branch, accessToken) {
    const path = PATHS.REF
                      .replace('${owner}', owner)
                      .replace('${repo}', repo)
                      .replace('${branch}', branch)
    const ref = await this.fetchPath('GET', path, null, accessToken)
    return ref.object
  }

  createBranch(owner, repo, branch, sha, accessToken) {
    const path = PATHS.CREATE_REF
                      .replace('${owner}', owner)
                      .replace('${repo}', repo)
    const payload = {
      ref: `refs/heads/${branch}`,
      sha
    }

    this.fetchPath('POST', path, payload, accessToken)
  }

  async readZapprFile(user, repo, accessToken) {
    // fetch file info
    const path = PATHS.ZAPPR_FILE_REPO.replace('${owner}', user).replace('${repo}', repo)
    try {
      let {content} = await this.fetchPath('GET', path, null, accessToken)
      // short circuit if there is no such file
      if (!content) {
        return {}
      }
      // decode file content
      let file = Buffer(content, 'base64').toString('utf8')
      return yaml.safeLoad(file)
    } catch (e) {
      // No .zappr file found, fall back to default configuration.
      return {}
    }
  }

  async updateWebhookFor(user, repo, events, accessToken) {
    debug(`${user}/${repo}: updating webhook with events: ${events.join(", ")}`)
    let path = PATHS.HOOK.replace('${owner}', user).replace('${repo}', repo)
    let hook_url = nconf.get('HOST_ADDR') + '/api/hook'
    // payload for hook
    let payload = {
      name: 'web',
      active: true,
      events,
      config: {
        url: hook_url,
        content_type: 'json',
        secret: HOOK_SECRET
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

  parseLinkHeader(header) {
    if (!header || !header.length) {
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

  /**
   * Load the first page or all pages of repositories.
   *
   * @param {String} accessToken - User's Github access token
   * @param {Boolean} loadAll - Load all pages of repositories
   * @returns {Array.<Object>}
   */
  async fetchRepos(accessToken, loadAll = false) {
    let repos = []
    var that = this
    const firstPage = await this.fetchRepoPage(0, accessToken)
    Array.prototype.push.apply(repos, firstPage.body)
    if (loadAll && firstPage.links.last > 0) {
      const pageDefs = Array(firstPage.links.last).fill(0).map((p, i) => i + 1)
      const pages = await Promise.all(pageDefs.map(async(page) => await that.fetchRepoPage(page, accessToken)))
      pages.forEach(p => Array.prototype.push.apply(repos, p.body))
    }
    return repos
  }

  async fetchPullRequestCommits(owner, repo, number, accessToken) {
    const path = PATHS.PR_COMMITS
                      .replace('${owner}', owner)
                      .replace('${repo}', repo)
                      .replace('${number}', number)
    try {
      return this.fetchPath('GET', path, null, accessToken)
    } catch(e) {
      // might happen if there is no pull request with this number
      return []
    }
  }
}