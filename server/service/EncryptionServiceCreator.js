import nconf from '../nconf'
import NullEncryptionService from './encryption/NullEncryptionService'
import KMSEncryptionService from './encryption/KMSEncryptionService'
import { logger } from '../../common/debug'

const warn = logger('encryption', 'warn')
const info = logger('encryption', 'info')
const log = logger('encryption')

const engine = nconf.get('ENCRYPTION_ENGINE')
info(`using encryption engine ${engine}`)

export function create(){
  switch (engine) {
    case 'kms':
      const KEY_ID = nconf.get('ENCRYPTION_KEY')
      const REGION = nconf.get('KMS_REGION')
      return new KMSEncryptionService(KEY_ID, REGION)
      break
    default:
      warn('token encryption disabled')
      return new NullEncryptionService()
  }
}
