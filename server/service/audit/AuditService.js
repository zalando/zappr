import identity from './transform/Identity'
import nconf from '../../../server/nconf'
import { getIn } from '../../../common/util'

function noop() {
}

export default class AuditService {
  constructor(logFn = noop, transformFn = identity) {
    this.logFn = logFn
    this.transformFn = transformFn
  }

  /**
   * Same API as transform(). Convenience method to transform + ship.
   */
  async log(auditEvent) {
    const AUDIT_RELEVANT_ORGS = nconf.get('AUDIT_RELEVANT_ORGS')
    const repoName = getIn(auditEvent, ['resource', 'repository', 'full_name'], '')
    if (!Array.isArray(AUDIT_RELEVANT_ORGS)) {
      await this.ship(this.transform(auditEvent))
    } else if (repoName && AUDIT_RELEVANT_ORGS.indexOf(repoName.split('/')[0]) !== -1) {
      await this.ship(this.transform(auditEvent))
    }
  }

  /**
   * Transforms various event data to single JSON object that will be logged. Default implementation!
   *
   * @param auditEvent - an instance of AuditEvent
   */
  transform(auditEvent) {
    return this.transformFn(auditEvent)
  }


  /**
   * Ships the result from transform() to whatever destination, e.g. a log file or a remote API
   *
   * @param body
   */
  ship(body) {
    return this.logFn(body)
  }
}
