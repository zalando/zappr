import Sequelize from 'sequelize'

import { db } from './Database'
import { deserializeJson, flattenToJson } from './properties'

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
    get: deserializeJson('json')
  }
}, {
  instanceMethods: {
    flatten: flattenToJson
  },
  schema: db.schema
})
