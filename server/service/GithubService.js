import path from 'path'
import nconf from '../nconf'
import { Counter } from 'prom-client'
import GithubServiceError from './GithubServiceError'
import { joinURL, promiseFirst, decode, encode, getIn, toGenericComment } from '../../common/util'
import { logger } from '../../common/debug'
import { request } from '../util'

const CallCounter = new Counter('github_api_requests', 'Status codes from Github API', ['type'])
const debug = logger('github')
const info = logger('github', 'info')
const error = logger('github', 'error')
const HOOK_SECRET = nconf.get('GITHUB_HOOK_SECRET')
const VALID_ZAPPR_FILE_PATHS = nconf.get('VALID_ZAPPR_FILE_PATHS')
const VALID_PR_TEMPLATES_PATHS = nconf.get('VALID_PR_TEMPLATE_PATHS')
const ZAPPR_AUTOCREATED_CONFIG = nconf.get('ZAPPR_AUTOCREATED_CONFIG')
const ZAPPR_WELCOME_BRANCH_NAME = nconf.get('ZAPPR_WELCOME_BRANCH_NAME')
const ZAPPR_WELCOME_TITLE = nconf.get('ZAPPR_WELCOME_TITLE')
const ZAPPR_WELCOME_TEXT = nconf.get('ZAPPR_WELCOME_TEXT')
const COMMIT_STATUS_MAX_LENGTH = 140
const BRANCH_PREVIEW_HEADER = 'application/vnd.github.loki-preview+json'

const API_URL_TEMPLATES = {
  HOOK: '/repos/${owner}/${repo}/hooks',
  PRS: '/repos/${owner}/${repo}/pulls?state=${state}&page=${page}',
  PR: '/repos/${owner}/${repo}/pulls/${number}',
  ORG_MEMBER: '/orgs/${org}/public_members/${user}',
  STATUS: '/repos/${owner}/${repo}/statuses/${sha}',
  COMMENT: '/repos/${owner}/${repo}/issues/${number}/comments',
  COLLABORATOR: '/repos/${owner}/${repo}/collaborators/${user}',
  REPO_CONTENT: '/repos/${owner}/${repo}/contents',
  REF: '/repos/${owner}/${repo}/git/refs/heads/${branch}',
  CREATE_REF: '/repos/${owner}/${repo}/git/refs',
  PR_COMMITS: '/repos/${owner}/${repo}/pulls/${number}/commits',
  BRANCH_PROTECTION: '/repos/${owner}/${repo}/branches/${branch}/protection',
  REQUIRED_STATUS_CHECKS: '/repos/${owner}/${repo}/branches/${branch}/protection/required_status_checks',
  ISSUE: '/repos/${owner}/${repo}/issues/${number}',
  PULL_REQUESTS: '/repos/${owner}/${repo}/pulls',
  BRANCH: '/repos/${owner}/${repo}/branches/${branch}',
  COMMITS: '/repos/${owner}/${repo}/git/commits',
  REPOS: '/user/repos?page=${page}&visibility=all'
}

export class GithubService {

  getOptions(method, path, body, accessToken, headers = {}) {
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

  async fetchPath(method, path, payload, accessToken, headers = {}) {
    const options = this.getOptions(method, path, payload, accessToken, headers)
    const [response, body] = await request(options)
    const {statusCode} = response || {}

    CallCounter.inc({type: 'total'}, 1)
    // 300 codes are for github membership checks
    if ([200, 201, 202, 203, 204, 300, 301, 302].indexOf(statusCode) < 0) {
      if (statusCode >= 400 && statusCode <= 499) {
        if (method !== 'GET' || statusCode !== 404) {
          // only log 4xx if not GET 404 (happens often during zappr.yaml file check
          error(`${statusCode} ${method} ${path}`, response.body)
        }
        CallCounter.inc({type: '4xx'}, 1)
      } else if (statusCode >= 500 && statusCode <= 599) {
        // always log 5xx
        error(`${statusCode} ${method} ${path}`, response.body)
        CallCounter.inc({type: '5xx'}, 1)
      }
      throw new GithubServiceError(response)
    }
    else {
      CallCounter.inc({type: 'success'}, 1)
      return body
    }
  }

  async _fetchPage(url, token) {
    let links = {}
    const [resp, body] = await request(this.getOptions('GET', url, null, token))
    if (resp.headers && resp.headers.link) {
      links = this.parseLinkHeader(resp.headers.link)
    }
    return {body, links}
  }

  /**
   * Takes an URL where it expects to find "${page}" as a placeholder for a
   * specific page to fetch. If loadAll is true, will return all pages, only
   * the first otherwise.
   *
   * @param urlTemplate
   * @param loadAll
   * @param token
   */
  async _fetchPaged(urlTemplate, loadAll, token) {
    const firstPage = await this._fetchPage(urlTemplate.replace('${page}', '0'), token)
    if (loadAll && firstPage.links.last > 0) {
      const pageDefs = Array(firstPage.links.last).fill(0).map((p, i) => i + 1)
      const pages = await Promise.all(
        pageDefs.map(
          page => this._fetchPage(urlTemplate.replace('${page}', page), token)))
      debug(`Fetched ${pageDefs.length + 1} pages for ${urlTemplate}`)
      return pages.reduce((all, page) => [...all, ...page.body], firstPage.body)
    }
    return firstPage.body
  }

  setCommitStatus(user, repo, sha, status, accessToken) {
    let path = API_URL_TEMPLATES.STATUS
                                .replace('${owner}', user)
                                .replace('${repo}', repo)
                                .replace('${sha}', sha)
    if (status.description.length > COMMIT_STATUS_MAX_LENGTH) {
      const ellipsis = '...' // actually three characters instead of one
      status.description = status.description.substring(0, COMMIT_STATUS_MAX_LENGTH - ellipsis.length) + ellipsis
    }
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

  async getComments(user, repo, number, since, accessToken) {
    let path = API_URL_TEMPLATES.COMMENT
                                .replace('${owner}', user)
                                .replace('${repo}', repo)
                                .replace('${number}', number)
    if (since) {
      path += `?since=${since}`
    }
    const comments = await this.fetchPath('GET', path, null, accessToken)
    if (since) {
      // return only comments created since
      const sinceDate = new Date(since)
      return comments.filter(c => new Date(c.created_at) >= sinceDate).map(toGenericComment)
    }
    // return generic comments
    return comments.map(toGenericComment)
  }


  getPullRequests(user, repo, token, state = 'open', loadAll = false) {
    const urlTemplate = API_URL_TEMPLATES.PRS
                                         .replace('${owner}', user)
                                         .replace('${repo}', repo)
                                         .replace('${state}', state)
    return this._fetchPaged(urlTemplate, loadAll, token)
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
    return this._readFile(VALID_ZAPPR_FILE_PATHS, user, repo, accessToken)
               .catch(() => {
                 info('%s/%s: No Zapprfile found, falling back to default configuration.', user, repo)
                 return ''
               })
  }

  readPullRequestTemplate(user, repo, accessToken) {
    return this._readFile(VALID_PR_TEMPLATES_PATHS, user, repo, accessToken)
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
        debug(`${user}/${repo}: updated existing webhook ${existing.id}`)
      } else {
        await this.fetchPath('DELETE', path, null, accessToken)
        debug(`${user}/${repo}: deleted existing webhook ${existing.id}`)
      }
    } else {
      await this.fetchPath('POST', path, payload, accessToken)
      debug(`${user}/${repo}: created new webhook`)
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

  /**
   * Load the first page or all pages of repositories.
   *
   * @param {String} accessToken - User's Github access token
   * @param {Boolean} loadAll - Load all pages of repositories
   * @returns {Array.<Object>}
   */
  fetchRepos(accessToken, loadAll = false) {
    return this._fetchPaged(API_URL_TEMPLATES.REPOS, loadAll, accessToken)
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

  /**
   * @param {string | Array<string>} paths of possible file location
   * @param {string} user
   * @param {string} repo
   * @param {string} accessToken
   *
   * @return {Promise} of github API response
   *
   * @private
   */
  _readFile(paths, user, repo, accessToken) {
    const repoUrl = API_URL_TEMPLATES.REPO_CONTENT
                                     .replace('${owner}', user)
                                     .replace('${repo}', repo)

    return promiseFirst((Array.isArray(paths) ? paths : [paths])
    .map(filename => path.join(repoUrl, filename))
    .map(url => this.fetchPath('GET', url, null, accessToken))
    ).then(({content, encoding, name}) => {
      debug(`${user}/${repo}: Found ${name}.`)
      return name ? decode(content, encoding) : ''
    })
  }

  /**
   * Returns the status check settings of supplied repository.
   *
   * @param user
   * @param repo
   * @param branch
   * @param accessToken
   * @returns {*}
   */
  getRequiredStatusChecks(user, repo, branch, accessToken) {
    const url = API_URL_TEMPLATES.REQUIRED_STATUS_CHECKS
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo)
                                 .replace('${branch}', branch)
    return this.fetchPath('GET', url, null, accessToken, {'Accept': BRANCH_PREVIEW_HEADER})
  }

  /**
   * Removes `check` from required status checks for supplied branch of repository.
   *
   * @param user
   * @param repo
   * @param branch
   * @param check
   * @param accessToken
   */
  async removeRequiredStatusCheck(user, repo, branch, check, accessToken) {
    const url = API_URL_TEMPLATES.REQUIRED_STATUS_CHECKS
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo)
                                 .replace('${branch}', branch)
    const settings = await this.getRequiredStatusChecks(user, repo, branch, accessToken)
    const requiredChecks = getIn(settings, 'contexts', [])
    if (requiredChecks.indexOf(check) !== -1) {
      const payload = {
        "include_admins": true,
        "contexts": requiredChecks.filter(required => check !== required)
      }
      debug(`${user}/${repo}: Removing status check ${check}`)
      await this.fetchPath('PATCH', url, payload, accessToken, {'Accept': BRANCH_PREVIEW_HEADER})
    }
  }

  /**
   * Adds `check` as a required status check for supplied branch of supplied repository.
   *
   * @param user
   * @param repo
   * @param branch
   * @param check
   * @param accessToken
   */
  async addRequiredStatusCheck(user, repo, branch, check, accessToken) {
    const url = API_URL_TEMPLATES.REQUIRED_STATUS_CHECKS
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo)
                                 .replace('${branch}', branch)
    const settings = await this.getRequiredStatusChecks(user, repo, branch, accessToken)
    const requiredChecks = getIn(settings, 'contexts', [])
    if (requiredChecks.indexOf(check) === -1) {
      const payload = {
        "include_admins": true,
        "contexts": [...requiredChecks, check]
      }
      debug(`${user}/${repo}: Adding status check ${check}`)
      await this.fetchPath('PATCH', url, payload, accessToken, {'Accept': BRANCH_PREVIEW_HEADER})
    }
  }

  /**
   * Returns true iff supplied branch of repository is protected.
   *
   * @param user
   * @param repo
   * @param branch
   * @param accessToken
   * @returns {boolean}
   */
  async isBranchProtected(user, repo, branch, accessToken) {
    const url = API_URL_TEMPLATES.BRANCH
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo)
                                 .replace('${branch}', branch)
    const branchInfo = await this.fetchPath('GET', url, null, accessToken, {'Accept': BRANCH_PREVIEW_HEADER})
    return !!branchInfo.protected
  }

  /**
   * Makes the branch protected if it isn't already and adds the supplied contexts as required status checks.
   *
   * @param user
   * @param repo
   * @param branch
   * @param statusCheck
   * @param accessToken
   */
  async protectBranch(user, repo, branch, statusCheck, accessToken) {
    const isProtected = await this.isBranchProtected(user, repo, branch, accessToken)
    if (!isProtected) {
      // set up new protection
      const url = API_URL_TEMPLATES.BRANCH_PROTECTION
                                   .replace('${owner}', user)
                                   .replace('${repo}', repo)
                                   .replace('${branch}', branch)
      const payload = {
        required_status_checks: {
          "include_admins": true,
          "strict": false,
          "contexts": statusCheck ? [statusCheck] : []
        },
        restrictions: null
      }
      debug(`${user}/${repo}: Protecting branch ${branch} with status check ${statusCheck}`)
      await this.fetchPath('PUT', url, payload, accessToken, {'Accept': BRANCH_PREVIEW_HEADER})
    } else {
      // update protection
      await this.addRequiredStatusCheck(user, repo, branch, statusCheck, accessToken)
    }
  }

  /**
   * Creates <branch> in user/repo from <sha> in default branch.
   *
   * https://developer.github.com/v3/git/refs/#create-a-reference
   *
   * @param user
   * @param repo
   * @param branch
   * @param sha
   * @param accessToken
   */
  createBranch(user, repo, branch, sha, accessToken) {
    const path = API_URL_TEMPLATES.CREATE_REF
                                  .replace('${owner}', user)
                                  .replace('${repo}', repo)
    const payload = {
      ref: `refs/heads/${branch}`,
      sha
    }

    return this.fetchPath('POST', path, payload, accessToken)
  }

  /**
   * Returns true if user/repo contains a Zapprfile, false otherwise.
   * @param user
   * @param repo
   * @param accessToken
   * @returns {Promise.<boolean>}
   */
  hasZapprFile(user, repo, accessToken) {
    return this._readFile(VALID_ZAPPR_FILE_PATHS, user, repo, accessToken)
               .then(() => true)
               .catch(() => false)
  }

  /**
   * Creates a file with the given content in the given branch of user/repo.
   *
   * https://developer.github.com/v3/repos/contents/#create-a-file
   *
   * @param user
   * @param repo
   * @param branch
   * @param path
   * @param content
   * @param accessToken
   */
  createFile(user, repo, branch, path, content, accessToken) {
    debug(`${user}/${repo}: Creating file ${path} on branch ${branch}`)
    const url = API_URL_TEMPLATES.REPO_CONTENT
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo) + `${path}`
    const message = `Create ${path}`
    const encodedContent = encode(content)
    return this.fetchPath('PUT', url, {message, branch, content: encodedContent}, accessToken)
  }

  /**
   * Creates a pull request in user/repo with the given data.
   *
   * https://developer.github.com/v3/pulls/#create-a-pull-request
   *
   * @param user
   * @param repo
   * @param head
   * @param base
   * @param title
   * @param body
   * @param accessToken
   */
  createPullRequest(user, repo, head, base, title, body, accessToken) {
    debug(`${user}/${repo}: Creating pull request "${title}"`)
    const url = API_URL_TEMPLATES.PULL_REQUESTS
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo)
    const payload = {
      title,
      head,
      base,
      body
    }
    return this.fetchPath('POST', url, payload, accessToken)
  }

  /**
   * Returns information about <branch> in user/repo.
   *
   * https://developer.github.com/v3/repos/branches/#get-branch
   * @param user
   * @param repo
   * @param branch
   * @param accessToken
   */
  getBranch(user, repo, branch, accessToken) {
    debug(`${user}/${repo}: Fetching branch ${branch}`)
    const url = API_URL_TEMPLATES.BRANCH
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo)
                                 .replace('${branch}', branch)
    return this.fetchPath('GET', url, null, accessToken)
  }

  /**
   * Creates a pull request in user/repo to be merged in base, that
   * contains an example Zappr configuration and a brief explanation
   * of Zappr.
   *
   * @param user
   * @param repo
   * @param base
   * @param accessToken
   */
  async proposeZapprfile(user, repo, base, accessToken) {
    // find latest commit on default branch
    const branchInfo = await this.getBranch(user, repo, base, accessToken)
    const headSHA = branchInfo.commit.sha
    // create branch
    await this.createBranch(user, repo, ZAPPR_WELCOME_BRANCH_NAME, headSHA, accessToken)
    // create zapprfile
    await this.createFile(user, repo, ZAPPR_WELCOME_BRANCH_NAME, VALID_ZAPPR_FILE_PATHS[0], ZAPPR_AUTOCREATED_CONFIG, accessToken)
    // open pull request
    const title = ZAPPR_WELCOME_TITLE
    const body = ZAPPR_WELCOME_TEXT
    return this.createPullRequest(user, repo, ZAPPR_WELCOME_BRANCH_NAME, base, title, body, accessToken)
  }

  /**
   * Returns all labels present on an issue/pull request.
   *
   * @param user
   * @param repo
   * @param number
   * @param token
   * @returns {Array<string>}
   */
  async getIssueLabels(user, repo, number, token) {
    const url = API_URL_TEMPLATES.ISSUE
                                 .replace('${owner}', user)
                                 .replace('${repo}', repo)
                                 .replace('${number}', number)
    const issue = await this.fetchPath('GET', url, null, token)
    return issue.labels.map(l => l.name)
  }
}

export const githubService = new GithubService()
