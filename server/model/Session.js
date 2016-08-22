import Sequelize from 'sequelize'

import { db } from './Database'
import { deserializeJson, flattenToJson } from './properties'

/**
 * PassportJS session.
 *
 * FIXME: session should be encrypted
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
  schema: db.schema,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
})
