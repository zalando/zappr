import Sequelize from 'sequelize'

import EncryptionService from '../service/EncryptionService'
import { db } from './Database'
import { deserializeJson } from './properties'
import { TYPES } from '../checks'
import { logger } from '../../common/debug'

const debug = logger('check')
const info = logger('check', 'info')
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
    beforeCreate: encryptTokenHook
  }
})

async function encryptTokenHook(check) {
  info('encrypt token hook')
  if (check.token) {
    const cipher = await encryptionService.encrypt(check.token)
    check.set('token', cipher)
  }
}
