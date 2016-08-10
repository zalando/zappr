import winston from 'winston'
import AuditService from './AuditService'

export default class FileAuditService extends AuditService {
  constructor(opts = {}) {
    super(opts)
  }

  withLogger(logger) {
    this.logger = logger
    this.logger.add(winston.transports.File, this.options)
    return this
  }
}

