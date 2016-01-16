import Sequelize from 'sequelize'

import Repository from './Repository'
import { db } from './database'
import { schema, deserializeJson, flattenToJson } from './properties'

/**
 * Zappr/Github user. Has many {@link Repository}.
 */
export default db.define('user', {
  id: {
    type: Sequelize.BIGINT,
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
