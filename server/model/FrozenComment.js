import Sequelize from 'sequelize'
import { db } from './Database'

export default db.define('frozen_comment', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
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
