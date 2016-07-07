export const REPOSITORY_DOES_NOT_EXIST = Symbol('repository does not exist')
export const DATABASE_ERROR = Symbol('database error')

export const REPO_ERROR_TYPE = Symbol('repository error')

/**
 * Thrown when an error occurs while handling Repository events.
 */
export default class RepositoryHandlerError extends Error {
  /**
   * @param {Symbol} type - error type
   * @param {Object} meta - meta information
   */
  constructor(type, meta) {
    const {repository} = meta
    let message = ''
    switch(type) {
      case REPOSITORY_DOES_NOT_EXIST: message = `Repository ${repository} does not exist`; break;
      case DATABASE_ERROR: message = `An error occured while storing/loading repository ${repository}`; break;
    }
    super('Error during repository processing')
    this.detail = message
    this.type = REPO_ERROR_TYPE
  }
}
