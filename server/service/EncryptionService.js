import nconf from '../nconf'
import NullEncryptionService from './encryption/NullEncryptionService'
import KMSEncryptionService from './encryption/KMSEncryptionService'
import { logger } from '../../common/debug'

const warn = logger('encryption', 'warn')
const info = logger('encryption', 'info')
const log = logger('encryption')

export default class EncryptionService {
  static instance;

  static create() {
    if (!this.instance) {
      const engine = nconf.get('ENCRYPTION_ENGINE')
      info(`using encryption engine ${engine}`)
      switch (engine) {
        case 'kms':
          const KEY_ID = nconf.get('ENCRYPTION_KEY')
          const REGION = nconf.get('KMS_REGION')
          this.instance = new KMSEncryptionService(KEY_ID, REGION)
          break
        default:
          warn('token encryption disabled')
          this.instance = new NullEncryptionService()
      }
    }
    return this.instance
  }
}
