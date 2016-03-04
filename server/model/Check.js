import Sequelize from 'sequelize'

import EncryptionService from '../service/EncryptionService'
import { db } from './Database'
import { deserializeJson } from './properties'
import { TYPES } from '../checks'
import { logger } from '../../common/debug'

const log = logger('check')
const encryptionService = EncryptionService.create()

/**
 * Zappr check. Belongs to a {@link Repository}.
 */
export default db.define('check', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: true
  },
  token: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  type: {
    type: Sequelize.ENUM(...TYPES),
    allowNull: false
  },
  arguments: {
    type: Sequelize.JSONB,
    allowNull: false,
    get: deserializeJson('arguments')
  }
}, {
  schema: db.schema,
  hooks: {
    beforeUpdate: encryptTokenHook,
    beforeCreate: encryptTokenHook,
    afterRestore: decryptTokenHook
  }
})

async function encryptTokenHook(check) {
  log('encrypt token hook %s', check.token)
  return await encryptionService.encrypt(check.token)
}

async function decryptTokenHook(check) {
  log('decrypt token hook %s', check.token)
  return await encryptionService.encrypt(check.token)
}
