import Sequelize from 'sequelize'
import config from './config'

import { logger } from '../common/debug'
const log = logger('model')

function getParameters(driver) {
  const options = {
    logging: log,
    typeValidation: true
  }
  switch (config.get('DB_DRIVER')) {
    case 'sqlite':
      return [
        config.get('DB_NAME'),
        null,
        null,
        {
          dialect: 'sqlite',
          storage: config.get('SQLITE_FILE'),
          ...options
        }
      ]
    case 'postgres':
      return [
        config.get('DB_NAME'),
        config.get('DB_USER'),
        config.get('DB_PASS'),
        {
          dialect: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get('DB_PORT'),
          ...options
        }
      ]
    default:
      throw new Error(`unsupported database driver ${driver}`)
  }
}

const sequelize = new Sequelize(...getParameters())

export const User = sequelize.define('user', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false
  }
})

export const Repository = sequelize.define('repository', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false
  }
})

export const Session = sequelize.define('session', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false,
    autoIncrement: false
  },
  json: {
    type: Sequelize.JSONB,
    allowNull: false
  }
})

export async function syncModel() {
  const schema = config.get('DB_SCHEMA')
  const schemas = await sequelize.showAllSchemas().
  catch(err => log('error fetching schemas', err))

  if (schemas.indexOf(schema) === -1) {
    await sequelize.createSchema(schema).
    catch(err => log('error creating schema', err))
  }

  return Promise.all([
    User.schema(schema).sync(),
    Repository.schema(schema).sync(),
    Session.schema(schema).sync()
  ]).
  then(models => log('synced models %o', models)).
  catch(err => log('error syncing model', err))
}
