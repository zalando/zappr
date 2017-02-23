import Sequelize from 'sequelize'
import dottie from 'dottie'

import User from './User'
import { db } from './Database'
import { deserializeJson } from './properties'
import { logger } from '../../common/debug'

const error = logger("Repository", "error")

/**
 * Github repository. Belongs to a {@link User}.
 */
export default db.define('repository', {
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
  welcomed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  scopes: {
    userId: userId => ({
      include: [{
        model: User,
        where: {id: userId},
        through: {
          attributes: [] // prevents association table from being included in the result
        }
      }]
    })
  },
  instanceMethods: {
    setJson: function (path, value) {
      if (db.getDialect() === 'postgres') {
        this.set(path, value)
      } else {
        const json = this.get('json')
        dottie.set(json, path.replace('json.', ''), value)
        this.set('json', json)
      }
    }
  },
  classMethods: {
    userScope: function (user) {
      return this.scope({method: ['userId', user.id]})
    },
    findAllSorted: function (options) {
      const order = {
        sqlite: ['id', 'ASC'],
        postgres: ['id', 'ASC'] // FIXME: [Sequelize.json('json.full_name'), 'ASC']
      }
      return this.findAll({
        ...options,
        order: [order[db.getDialect()]]
      })
    }
  },
  schema: db.schema,
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
})
