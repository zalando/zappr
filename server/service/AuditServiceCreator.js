import nconf from '../nconf'
import AuditService from './audit/AuditService'
import getFileShipper from './audit/ship/file'
import getZalandoAuditTrailShipper from './audit/ship/ZalandoAuditTrail'
import IdentityTransform from './audit/transform/Identity'

import { logger } from '../../common/debug'
const warn = logger('audit', 'warn')
const info = logger('audit', 'info')

const transformEngine = nconf.get('AUDIT_TRANSFORM_ENGINE')
const shipEngine = nconf.get('AUDIT_SHIP_ENGINE')
info(`using audit engine ${shipEngine} with ${transformEngine} transformation`)

function createShipper() {
  switch (shipEngine) {
    case 'file':
      const FILENAME = nconf.get('AUDIT_FILENAME') || "audit.log"
      const MAXSIZE = nconf.get('AUDIT_MAX_SIZE') || 10 ** 7 // 10 MB default max size
      const MAXFILES = nconf.get('AUDIT_MAX_FILES') || 3 // keep 3 files

      info(`writing audit logs to: ${FILENAME}`)
      return getFileShipper({
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
    case 'zalando-audittrail':
      const url = nconf.get('AUDITTRAIL_URL')
      info(`writing audit logs to zalando audit trail API on ${url}`)
      return getZalandoAuditTrailShipper({url})
    default:
      warn('writing audit logs to console')
      return console.log.bind(console)
  }
}

function createTransformer() {
  switch (transformEngine) {
    case 'identity':
      return IdentityTransform
    default:
      return IdentityTransform
  }
}

export default function create() {
  return new AuditService(createShipper(), createTransformer())
}
