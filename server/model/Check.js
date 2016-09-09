import Sequelize from 'sequelize'

import * as EncryptionServiceCreator from '../service/EncryptionServiceCreator'
import { db } from './Database'
import { CHECK_TYPES } from '../checks'
import { logger } from '../../common/debug'

const debug = logger('check')
const encryptionService = EncryptionServiceCreator.create()

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
    type: Sequelize.ENUM(...CHECK_TYPES),
    allowNull: false
  },
  created_by: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW()
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW()
  }
}, {
  schema: db.schema,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  instanceMethods: {
    /**
     * Never return the token in JSON.
     *
     * @override
     * @returns {object}
     */
    toJSON: function () {
      const json = this.get({plain: true})
      delete json.token
      return json
    }
  },
  hooks: {
    beforeUpdate: encryptTokenHook,
    beforeCreate: encryptTokenHook
  }
})

async function encryptTokenHook(check) {
  debug('encrypt token hook')
  if (check.token) {
    const cipher = await encryptionService.encrypt(check.token)
    check.set('token', cipher)
  }
}
