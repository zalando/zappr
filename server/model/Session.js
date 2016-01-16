import Sequelize from 'sequelize'
import Repository from './Repository'

import { db } from './database'
import { schema, deserializeJson, flattenToJson } from './properties'

/**
 * PassportJS session.
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
    get: deserializeJson
  }
}, {
  instanceMethods: {
    flatten: flattenToJson
  },
  schema: schema
})
