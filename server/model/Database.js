import Sequelize from 'sequelize'
import nconf from '../nconf'
import * as EncryptionServiceCreator from '../service/EncryptionServiceCreator'
import { logger } from '../../common/debug'

import { User, Repository, UserRepository, Check, PullRequest, Session, FrozenComment } from './'

const log = logger('model')
const error = logger('model', 'error')
const encryptionService = EncryptionServiceCreator.create()

async function decryptToken(check) {
  const plain = await encryptionService.decrypt(check.token)
  check.set('token', plain)
  return check
}

async function decryptTokenHook(thing) {
  if (thing && Array.isArray(thing.checks)) {
    log('decrypt token hook')
    await Promise.all(thing.checks.map(async(c) => await decryptToken(c)))
  }
  return thing
}

function getParameters(driver = nconf.get('DB_DRIVER')) {
  const options = {
    logging: log,
    hooks: {
      afterFind: decryptTokenHook
    },
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

class Database extends Sequelize {
  constructor(...args) {
    super(...args)
  }

  /**
   * @returns {String}
   */
  get schema() {
    return nconf.get('DB_SCHEMA')
  }

  /**
   * Creates tables. Use only in tests!
   * @private
   */
  async _sync() {
    log(`syncing models...`)
    try {
      await User.sync()
      await Repository.sync()
      await UserRepository.sync()
      await Check.sync()
      await PullRequest.sync()
      await FrozenComment.sync()
      await Session.sync()
      log('synced models')
    } catch (e) {
      error(e)
    }
  }

  /**
   * Create the database schemas
   *
   * @returns {Promise}
   */
  async createSchemas() {
    const schemas = await db.showAllSchemas()

    if (schemas.indexOf(this.schema) === -1) {
      await db.createSchema('zappr_meta')
      log('created schema zappr_meta')
      const result = await db.createSchema(this.schema)
      log('created schema' + result)
    }
  }
}

export const db = new Database(...getParameters())
