import Sequelize from 'sequelize'

import { db } from './Database'
import { deserializeJson } from './properties'
import * as AccessLevel from '../../common/AccessLevels'

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
  access_level: {
    type: Sequelize.ENUM(...AccessLevel.MODES),
    allowNull: false,
    defaultValue: AccessLevel.MINIMAL
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
  schema: db.schema,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
})
