import nconf from '../nconf'
import NullEncryptionService from './encryption/NullEncryptionService'

import { logger } from '../../common/debug'

const log = logger('encryption')

export default class EncryptionService {

  static create() {
    switch (nconf.get('ENCRYPTION_ENGINE')) {
      case 'kms':
        throw new Error('unsupported encryption engine')
      default:
        log('WARNING: token encryption disabled')
        return new NullEncryptionService()
    }
  }
}
