import nconf from '../nconf'
import DefaultLogger from './audit/DefaultLogger'
import NullAuditService from './audit/NullAuditService'
import FileAuditService from './audit/FileAuditService'
import ZalandoAuditService from './audit/ZalandoAuditService'

import { logger } from '../../common/debug'
const warn = logger('audit', 'warn')
const info = logger('audit', 'info')

const engine = nconf.get('AUDIT_ENGINE')
info(`using audit engine ${engine}`)

export default function create() {
  switch (engine) {
    case 'file':
      const FILENAME = nconf.get('AUDIT_FILENAME') || "audit.log"
      const MAXSIZE = nconf.get('AUDIT_MAX_SIZE') || 10 ** 7 // 10 MB default max size
      const MAXFILES = nconf.get('AUDIT_MAX_FILES') || 3 // keep 3 files

      info(`writing audit logs to: ${FILENAME}`)
      return new FileAuditService({
        filename: FILENAME,
        maxsize: MAXSIZE,
        maxfiles: MAXFILES,
        level: 'info',
        silent: false,
        colorize: false,
        timestamp: false,
        json: true,
        showLevel: false,
        zippedArchive: true
      })
      .withLogger(DefaultLogger)
    case 'zalando-audittrail':
      const URL = nconf.get('AUDITTRAIL_URL')
      return new ZalandoAuditService({url: URL}).withLogger(DefaultLogger)
    default:
      warn('audit logging disabled')
      return new NullAuditService()
  }
}
