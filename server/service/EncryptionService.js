import nconf from '../nconf'
import NullEncryptionService from './encryption/NullEncryptionService'
import KMSEncryptionService from './encryption/KMSEncryptionService'
import { logger } from '../../common/debug'

const warn = logger('encryption', 'warn')
const log = logger('encryption')

export default class EncryptionService {

  static create() {
    switch (nconf.get('ENCRYPTION_ENGINE')) {
      case 'kms':
        const KEY_ID = nconf.get('ENCRYPTION_KEY')
        const REGION = nconf.get('KMS_REGION')
        return new KMSEncryptionService(KEY_ID, REGION)
      default:
        warn('token encryption disabled')
        return new NullEncryptionService()
    }
  }
}
