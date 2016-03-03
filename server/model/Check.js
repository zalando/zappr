import Sequelize from 'sequelize'

import { db } from './Database'
import { deserializeJson } from './properties'
import { TYPES } from '../checks'

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
    type: Sequelize.STRING
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
  schema: db.schema
})
