import { db } from './Database'

/**
 *  User <(n)---(m)> Repository
 */
export const UserRepository = db.define('user_repository', {}, {schema: db.schema})
