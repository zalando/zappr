import User from './User'
import Repository from './Repository'
import Session from './Session'
import { db } from './database'
import { schema } from './properties'

import { logger } from '../../common/debug'
const log = logger('model')

// Relations, see http://docs.sequelizejs.com/en/latest/docs/associations
User.hasMany(Repository, {foreignKey: {allowNull: false}})
Repository.belongsTo(User, {foreignKey: {allowNull: false}})

/**
 * Create the database schema and sync all models.
 *
 * @returns {Promise}
 */
export async function syncDB() {
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

export { db } from './database'
export { default as User } from './User'
export { default as Repository } from './Repository'
export { default as Session } from './Session'
