/**
 * Standardized problem response type.
 * @see {@link https://github.com/zalando/problem}
 */
export default class Problem {
  constructor(members = {}, extensions = {}) {
    const {title, status, detail, type, instance} = members
    this.title = title
    this.instance = instance
    this.status = status
    this.detail = detail
    this.type = type
    this.extensions = extensions
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

  withExtensions(extensions) {
    this.extensions = extensions
    return this
  }

  toJSON() {
    const {type, status, detail, instance, title, extensions} = this
    return Object.assign({}, extensions, {
      type, status, detail, instance, title
    })
  }
}
