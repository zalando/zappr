import Sequelize from 'sequelize'
import { db } from './Database'

export default db.define('blacklisted_comment', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
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
