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
  classMethods: {
    pullRequestScope: prId => ({
      where: {
        pullRequestId: prId
      }
    })
  }
})
