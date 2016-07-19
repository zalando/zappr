import AuditEvent  from '../../../common/AuditEvent'
import { logger } from '../../../common/debug'
const error = logger('audit', 'error')

export default class AuditService {
  constructor(opts = {}) {
    this.options = opts
  }

  /**
   * Same as log(), but doesn't wait.
   */
  logSync() {
    try {
      this.ship(this.transform(...arguments))
    } catch (e) {
      error(e)
    }
  }

  /**
   * Same API as transform(). Convenience method to transform + ship.
   */
  async log() {
    try {
      await this.ship(this.transform(...arguments))
    } catch (e) {
      error(e)
    }
  }

  /**
   * Transforms various event data to single JSON object that will be logged. Default implementation!
   *
   * @param auditEvent - an instance of AuditEvent
   * @returns {{id, github_event: {type: string, sender: string}, resource: {repositoryId: number, repository: string, pull_request: number, commit: string}, zappr_event: {type: string, sender: string}, timestamp: string, result: {}}}
   */
  transform(auditEvent) {
    if (auditEvent instanceof AuditEvent) {
      return auditEvent.toJSON()
    }
    return auditEvent
  }


  /**
   * Ships the result from transform() to whatever destination, e.g. a log file or a remote API
   *
   * @param body
   */
  async ship(body) {
    throw new Error('Implement in subclass')
  }
}
