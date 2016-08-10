import AuditService from './AuditService'
import AuditTrailTransport from './ZalandoAuditTrailTransport'

export default class ZalandoAuditService extends AuditService {
  constructor(opts = {}) {
    super(opts)
  }

  withLogger(logger) {
    this.logger = logger
    this.logger.add(AuditTrailTransport, this.options)
    return this
  }

  transform(auditEvent) {
    //TODO implement
  }
}
