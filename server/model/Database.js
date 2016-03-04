import Sequelize from 'sequelize'
import nconf from '../nconf'
import EncryptionService from '../service/EncryptionService'
import { logger } from '../../common/debug'

const log = logger('model')
const encryptionService = EncryptionService.create()

async function decryptToken(check) {
  const plain = await encryptionService.decrypt(check.token)
  check.set('token', plain)
  return check
}

async function decryptTokenHook(thing) {
  if (thing && Array.isArray(thing.checks)) {
    log('decrypt token hook')
    const decryptedChecks = await Promise.all(thing.checks.map(async c => await decryptToken(c)))
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
   * Create the database schema and sync all models.
   *
   * @returns {Promise}
   */
  async sync() {
    const schemas = await db.showAllSchemas()

    if (schemas.indexOf(this.schema) === -1) {
      await db.createSchema(this.schema).
      then(result => log('created schema %o', result))
    }

    const values = obj => Object.keys(obj).map(k => obj[k])

    return Promise.all(values(this.models).map(m => m.sync())).
    then(models => log('synced models %o', models))
  }
}

export const db = new Database(...getParameters())
