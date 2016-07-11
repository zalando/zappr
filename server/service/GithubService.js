import path from 'path'
import nconf from '../nconf'
import GithubServiceError from './GithubServiceError'
import { joinURL, promiseFirst, decode, getIn } from '../../common/util'
import { logger } from '../../common/debug'
import { request } from '../util'

const debug = logger('github')
const info = logger('github', 'info')
const error = logger('github', 'error')
const HOOK_SECRET = nconf.get('GITHUB_HOOK_SECRET')
const VALID_ZAPPR_FILE_PATHS = nconf.get('VALID_ZAPPR_FILE_PATHS')

const API_URL_TEMPLATES = {
  HOOK: '/repos/${owner}/${repo}/hooks',
  PR: '/repos/${owner}/${repo}/pulls/${number}',
  ORG_MEMBER: '/orgs/${org}/public_members/${user}',
  STATUS: '/repos/${owner}/${repo}/statuses/${sha}',
  COMMENT: '/repos/${owner}/${repo}/issues/${number}/comments',
  COLLABORATOR: '/repos/${owner}/${repo}/collaborators/${user}',
  REPO_CONTENT: '/repos/${owner}/${repo}/contents',
  REF: '/repos/${owner}/${repo}/git/refs/heads/${branch}',
  CREATE_REF: '/repos/${owner}/${repo}/git/refs',
  PR_COMMITS: '/repos/${owner}/${repo}/pulls/${number}/commits',
  REPOS: '/user/repos?page=${page}&visibility=public'
}

function fromBase64(encoded) {
  return new Buffer(encoded, 'base64').toString('utf8')
}

export class GithubService {

  getOptions(method, path, body, accessToken) {
    const headers = {}
    headers['User-Agent'] = `Zappr (+${nconf.get('HOST_ADDR')})`
    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`
    }
    return {
      json: true,
      method: method,
      url: joinURL(nconf.get('GITHUB_API_URL'), path),
      headers,
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
      throw new GithubServiceError(response)
    }
    else return body
  }

  setCommitStatus(user, repo, sha, status, accessToken) {
    let path = API_URL_TEMPLATES.STATUS
                                .replace('${owner}', user)
                                .replace('${repo}', repo)
                                .replace('${sha}', sha)
    return this.fetchPath('POST', path, status, accessToken)
  }

  async isCollaborator(owner, repo, user, accessToken) {
    let path = API_URL_TEMPLATES.COLLABORATOR
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
    let path = API_URL_TEMPLATES.ORG_MEMBER
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
    let path = API_URL_TEMPLATES.COMMENT
                                .replace('${owner}', user)
                                .replace('${repo}', repo)
                                .replace('${number}', number)
    if (since) {
      path += `?since=${since}`
    }
    return this.fetchPath('GET', path, null, accessToken)
  }

  async getPullRequest(user, repo, number, accessToken) {
    const path = API_URL_TEMPLATES.PR
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
    const path = API_URL_TEMPLATES.REF
                                  .replace('${owner}', owner)
                                  .replace('${repo}', repo)
                                  .replace('${branch}', branch)
    const ref = await this.fetchPath('GET', path, null, accessToken)
    return ref.object
  }

  createBranch(owner, repo, branch, sha, accessToken) {
    const path = API_URL_TEMPLATES.CREATE_REF
                                  .replace('${owner}', owner)
                                  .replace('${repo}', repo)
    const payload = {
      ref: `refs/heads/${branch}`,
      sha
    }

    this.fetchPath('POST', path, payload, accessToken)
  }

  readZapprFile(user, repo, accessToken) {
    const repoContentUrl = API_URL_TEMPLATES.REPO_CONTENT
                                            .replace('${owner}', user)
                                            .replace('${repo}', repo)
    const validZapprFileUrls = VALID_ZAPPR_FILE_PATHS.map(zapprFilePath => path.join(repoContentUrl, zapprFilePath))

    const zapprFileRequests = validZapprFileUrls.map(zapprFileUrl => this.fetchPath('GET', zapprFileUrl, null, accessToken))
    return promiseFirst(zapprFileRequests)
    .catch(() => {
      info('%s/%s: No Zapprfile found, falling back to default configuration.', user, repo)
      return ''
    })
    .then(({content, encoding, name}) => {
      info('%s/%s: Found %s.', user, repo, name)
      return name ? decode(content, encoding) : ''
    })
  }

  async updateWebhookFor(user, repo, events, accessToken) {
    debug(`${user}/${repo}: updating webhook with events: ${events.join(", ")}`)
    let path = API_URL_TEMPLATES.HOOK.replace('${owner}', user).replace('${repo}', repo)
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
    return header.split(',')
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
    const url = API_URL_TEMPLATES.REPOS.replace('${page}', page)
    const [resp, body] = await request(this.getOptions('GET', url, null, accessToken))

    debug('fetched repository page response headers: %o body: %o', resp.headers, body)

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
    info('Loaded %d repos from Github', repos.length)
    return repos
  }

  /**
   * Gets first 250 commits on a pull request.
   *
   * @param owner The repo owner, e.g. zalando
   * @param repo The repo name, e.g. zappr
   * @param number The PR number, e.g. 207
   * @param accessToken The Github access token to use
   * @returns {*} See https://developer.github.com/v3/pulls/#list-commits-on-a-pull-request
   */
  async fetchPullRequestCommits(owner, repo, number, accessToken) {
    const path = API_URL_TEMPLATES.PR_COMMITS
                                  .replace('${owner}', owner)
                                  .replace('${repo}', repo)
                                  .replace('${number}', number)
    try {
      return this.fetchPath('GET', path, null, accessToken)
    } catch (e) {
      // might happen if there is no pull request with this number
      debug(`${owner}/${repo}#${number}: Call failed or not a pull request`)
      return []
    }
  }

  async fetchLastCommitter(owner, repo, number, accessToken) {
    const commits = await this.fetchPullRequestCommits(owner, repo, number, accessToken)
    const lastCommit = commits[commits.length - 1]
    return getIn(lastCommit, ['committer', 'login'])
  }
}

export const githubService = new GithubService()
