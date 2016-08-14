import Sequelize from 'sequelize'

import { db } from './Database'
import { deserializeJson } from './properties'

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
  zappr_mode: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: 'default'
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false,
    get: deserializeJson('json')
  }
}, {
  schema: db.schema
})
