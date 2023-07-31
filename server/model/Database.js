import Sequelize from 'sequelize'
import nconf from '../nconf'
import * as EncryptionServiceCreator from '../service/EncryptionServiceCreator'
import { logger } from '../../common/debug'
import { getIn, setIn } from '../../common/util'

import { User, Repository, UserRepository, Check, PullRequest, Session, FrozenComment } from './'

const log = logger('model')
const error = logger('model', 'error')
const encryptionService = EncryptionServiceCreator.create()
const DATA_SCHEMA = 'zappr_data'
const META_SCHEMA = 'zappr_meta'

/**
 * Global token decryption hook.
 *
 * @param thing
 * @returns {*}
 */
async function decryptTokenHook(thing) {
  /**
   * We check for the existence of a function `set` because if there is none,
   * it means that we selected with raw=true and thus don't want to change
   * the raw database content.
   */
  if (thing) {
    /**
     * Repository with list of checks (that have tokens)
     */
    if (Array.isArray(thing.checks) && typeof thing.set === 'function') {
      log('decrypt token hook')
      await Promise.all(thing.checks.map(async(c) => {
        const plain = await encryptionService.decrypt(c.token)
        c.set('token', plain)
        return c
      }))
    }
    /**
     * Single check with token
     */
    else if (thing.token && typeof thing.set === 'function') {
      const plain = await encryptionService.decrypt(thing.token)
      thing.set('token', plain)
    }
    /**
     * Session
     */
    else {
      const token = getIn(thing.json, ['passport', 'user', 'accessToken'], false)
      if (token && typeof thing.set === 'function') {
        log('decrypt token hook')
        try {
          const plain = await encryptionService.decrypt(token)
          thing.set('json', setIn(thing.json, ['passport', 'user', 'accessToken'], plain))
        } catch (e) {
          log(`no decryption of token ${token.substring(0, 4)} necessary`)
        }
      }
    }
  }
  return thing
}

class Database extends Sequelize {
  constructor(...args) {
    super(...args)
  }

  /**
   * @returns {String}
   */
  get schema() {
    return DATA_SCHEMA
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
      await db.createSchema(META_SCHEMA)
      log('created schema zappr_meta')
      const result = await db.createSchema(DATA_SCHEMA)
      log('created schema' + result)
    }
  }
}

export const db = new Database(
  nconf.get('DB_NAME'),
  nconf.get('DB_USER'),
  nconf.get('DB_PASS'),
  {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: nconf.get('DB_SSL') === 'true' || nconf.get('DB_SSL') === true,
        /**
         * fixes self-signed cert issue for testbed deployments (https://stackoverflow.com/questions/58965011/sequelizeconnectionerror-self-signed-certificate)
         */
        rejectUnauthorized: false
    }
    },
    host: nconf.get('DB_HOST'),
    port: nconf.get('DB_PORT'),
    logging: log,
    benchmark: true,
    hooks: {
      afterFind: decryptTokenHook
    },
    typeValidation: true
  });
