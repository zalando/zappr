import Sequelize from 'sequelize'
import dottie from 'dottie'
import nconf from './nconf'

import { logger } from '../common/debug'
const log = logger('model')

function getParameters(driver = nconf.get('DB_DRIVER')) {
  const options = {
    logging: log,
    typeValidation: true
  }
  switch (driver) {
    case 'sqlite':
      return [
        nconf.get('DB_NAME'),
        null,
        null,
        {
          dialect: driver,
          storage: nconf.get('SQLITE_FILE'),
          ...options
        }
      ]
    case 'postgres':
      return [
        nconf.get('DB_NAME'),
        nconf.get('DB_USER'),
        nconf.get('DB_PASS'),
        {
          dialect: driver,
          host: nconf.get('DB_HOST'),
          port: nconf.get('DB_PORT'),
          ...options
        }
      ]
    default:
      throw new Error(`unsupported database driver ${driver}`)
  }
}

export const db = new Sequelize(...getParameters())

const schema = nconf.get('DB_SCHEMA')

/**
 * Model property getter.
 *
 * Return the 'json' value as an object.
 *
 * @returns {Object}
 */
function deserializeJson() {
  const json = this.getDataValue('json')
  return typeof json === 'string' ? JSON.parse(json) : json
}

/**
 * Model instance method.
 *
 * Flatten the 'json' property and the
 * other values into one plain object.
 *
 * @returns {Object}
 */
function flattenToJson() {
  const {json, ...rest} = this.toJSON()
  return {...json, ...rest}
}

export const User = db.define('user', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false,
    get: deserializeJson
  }
}, {
  instanceMethods: {
    flatten: flattenToJson
  },
  schema: schema
})

export const Repository = db.define('repository', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false,
    get: deserializeJson
  }
}, {
  scopes: {
    userId: userId => ({where: {userId}})
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
    },
    flatten: flattenToJson
  },
  classMethods: {
    userScope: function (user) {
      return this.scope({method: ['userId', user.id]})
    },
    findAllSorted: function () {
      const order = {
        sqlite: ['id', 'ASC'],
        postgres: [db.json('json.name'), 'ASC']
      }
      return this.findAll({
        order: [order[db.getDialect()]]
      })
    }
  },
  schema: schema
})

User.hasMany(Repository, {foreignKey: {allowNull: false}})
Repository.belongsTo(User, {foreignKey: {allowNull: false}})

export const Session = db.define('session', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false,
    get: deserializeJson
  }
}, {
  instanceMethods: {
    flatten: flattenToJson
  },
  schema: schema
})

export async function sync() {
  const schemas = await db.showAllSchemas()

  if (schemas.indexOf(schema) === -1) {
    await db.createSchema(schema).
    then(result => log('created schema %o', result))
  }

  return Promise.all([
    User.sync(),
    Repository.sync(),
    Session.sync()
  ]).
  then(models => log('synced models %o', models))
}
