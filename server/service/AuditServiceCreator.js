import nconf from '../nconf'

import NullAuditService from './audit/NullAuditService';
import FileAuditService from './audit/FileAuditService'
import { logger } from '../../common/debug'

const warn = logger('audit', 'warn')
const info = logger('audit', 'info')

const engine = nconf.get('AUDIT_ENGINE')
info(`using audit engine ${engine}`)

export default function create(){
  switch (engine) {
    case 'file':
      const FILENAME = nconf.get('AUDIT_FILENAME')
      info(`writing audit logs to: ${FILENAME}`)
      return new FileAuditService({filename: FILENAME})
      break
    default:
      warn('audit logging disabled')
      return new NullAuditService()
  }
}
