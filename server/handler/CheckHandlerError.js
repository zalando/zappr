/**
 * Thrown when an error occurs while handling Check events.
 */
export default class CheckHandlerError extends Error {
  /**
   * @param {String} message - message
   * @param {Error|Number} cause - original cause or error code
   * @param {Number} code - error code
   */
  constructor(message, cause = 404, code = 404) {
    super(message)
    this.cause = cause
    this.code = cause.code || code
  }
}
