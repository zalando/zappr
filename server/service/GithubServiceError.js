import { getIn } from '../../common/util'

/**
 * @param {Object} response - HTTP response
 * @returns {string}
 */
function messageFrom(response) {
  const url = getIn(response, ['request', 'uri', 'href'], '{url}')
  const message = getIn(response, ['body', 'message'], '{message}')
  const method = getIn(response, ['request', 'method'], '{method}')
  return [method, url, response.statusCode, message].join(' ')
}

export const GITHUB_ERROR_TYPE = Symbol('github error')


/**
 * Thrown when an error occurs while accessing the Github API.
 */
export default class GithubServiceError extends Error {
  /**
   * @param {Object} response - HTTP response
   */
  constructor(response) {
    super('Github API Error')
    this.detail = messageFrom(response)
    this.type = GITHUB_ERROR_TYPE
  }
}

export class GithubBranchProtectedError extends Error {
  /**
   * @param {Object} response - HTTP response
   */
  constructor(response) {
    super('Github API Error: changing Branch Protection Settings is Disabled')
    this.detail = messageFrom(response)
    this.type = GITHUB_ERROR_TYPE
  }
}
