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

/**
 * Thrown when an error occurs while accessing the Github API.
 */
export default class GithubServiceError extends Error {
  /**
   * @param {Object} response - HTTP response
   */
  constructor(response) {
    super(messageFrom(response))
    this.status = response.statusCode
  }
}
