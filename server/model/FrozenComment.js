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
  }
}, {
  schema: db.schema,
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
