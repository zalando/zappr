import Sequelize from 'sequelize'

import { db } from './Database'
import { deserializeJson } from './properties'
import * as AccessLevel from '../../common/AccessLevels'
import { logger } from '../../common/debug'

const error = logger("User", "error")

/**
 * Zappr/Github user. Has many {@link Repository}.
 */
export default db.define('user', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false,
    get: function() {
      // Sequelize converts BIGINTs to strings to avoid precision loss
      const id = this.getDataValue('id')
      // Since we prevent too large numbers to be stored, we can safely
      // parse them again.
      return parseInt(id, 10)
    },
    set: function(value) {
      if (!Number.isSafeInteger(value)) {
        const msg = `Trying to store a number that cannot safely be represented in Javascript!`
        error(msg)
        throw new Error(msg)
      }
      this.setDataValue('id', value)
    }
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
