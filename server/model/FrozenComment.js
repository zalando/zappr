import Sequelize from 'sequelize'
import { db } from './Database'
import { logger } from '../../common/debug'

const error = logger("FrozenComment", "error")

export default db.define('frozen_comment', {
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
      return value
    }
  },
  user: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  created_at: {
    type: Sequelize.DATE,
    allowNull: false
  },
  body: {
    type: Sequelize.TEXT,
    allowNull: false
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
  scopes: {
    pullRequest: prId => ({
      where: {
        pullRequestId: prId
      }
    })
  },
  classMethods: {
    pullRequestScope: function (prId) {
      return this.scope({method: ['pullRequest', prId]})
    }
  }
})
