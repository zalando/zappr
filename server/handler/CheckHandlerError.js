export const CHECK_EXISTS = Symbol('Check exists')
export const CHECK_DOES_NOT_EXIST = Symbol('Check doesn not exist')
export const DATABASE_ERROR = Symbol('Generic check error')

export const CHECK_ERROR_TYPE = Symbol('check error')

/**
 * Thrown when an error occurs while handling Check events.
 */
export default class CheckHandlerError extends Error {
  /**
   * @param {Symbol} errorType - error type
   * @param {Object} meta - metadata about the check
   */
  constructor(errorType, meta) {
    const {type, repository} = meta
    let message = ''
    switch (errorType) {
      case CHECK_EXISTS: message = `Check ${type} already exists for repository ${repository}`; break;
      case CHECK_DOES_NOT_EXIST: message = `Check ${type} does not exist`; break;
      case DATABASE_ERROR: message = `An error occured while storing/loading a check. ${repository} ${type}`; break;
    }
    super('Error during check processing')
    this.detail = message
    this.type = CHECK_ERROR_TYPE
  }
}
