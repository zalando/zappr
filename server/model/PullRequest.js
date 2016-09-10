import Sequelize from 'sequelize'

import { db } from './Database'

/**
 * Pull Request. Belongs to a {@link Repository}.
 */
export default db.define('pull_request', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: true
  },
  number: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  last_push: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
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
