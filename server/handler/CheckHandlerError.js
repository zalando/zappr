/**
 * Thrown when an error occurs while handling Check events.
 */
export default class CheckHandlerError extends Error {
  /**
   * @param {String} message - message
   * @param {String} cause - original cause
   */
  constructor(message, cause = '') {
    super(message)
    this.detail = cause
  }
}
