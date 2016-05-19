/**
 * Standardized problem response type.
 * @see {@link https://github.com/zalando/problem}
 */
export default class Problem {
  constructor(args = {}) {
    this.title = args.title
    this.status = args.status
    this.detail = args.detail
    this.type = args.type
  }

  /**
   * @param {String} title
   * @returns {Problem}
   */
  withTitle(title) {
    this.title = title
    return this
  }

  /**
   * @param {Number} status
   * @returns {Problem}
   */
  withStatus(status) {
    this.status = status
    return this
  }

  /**
   * @param {String} detail
   * @returns {Problem}
   */
  withDetail(detail) {
    this.detail = detail
    return this
  }

  /**
   * @param {String} type
   * @returns {Problem}
   */
  withType(type) {
    this.type = type
    return this
  }
}

export class ResponseProblem extends Problem {
  /**
   * @param {Response} response
   */
  constructor(response) {
    super({
      title: response.statusText,
      status: response.status,
      detail: response.url
    })
  }
}
