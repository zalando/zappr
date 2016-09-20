import Sequelize from 'sequelize'

import { db } from './Database'
import { getIn, setIn } from '../../common/util'
import { deserializeJson, flattenToJson } from './properties'
import { create as createEncryptionService } from '../../server/service/EncryptionServiceCreator'
import { logger } from '../../common/debug'

const debug = logger('session')
const encryptionService = createEncryptionService()

async function encryptTokenHook(session) {
  debug('encrypt token hook')
  const tokenPath = ['passport', 'user', 'accessToken']
  const token = getIn(session.json, tokenPath, false)
  if (token) {
    const cipher = await encryptionService.encrypt(token)
    session.set('json', setIn(session.json, tokenPath, cipher))
  }
}

/**
 * PassportJS session
 */
export default db.define('session', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false,
    get: deserializeJson('json')
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
  instanceMethods: {
    flatten: flattenToJson
  },
  hooks: {
    beforeCreate: encryptTokenHook,
    beforeUpdate: encryptTokenHook,
  },
  schema: db.schema,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
})
