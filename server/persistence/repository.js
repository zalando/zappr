import Database from './database'

import { logger } from '../../common/debug'
const log = logger('app')

export default class Repository {
  constructor(name) {
    if (!name || typeof name !== 'string')
      throw new Error('invalid name')
    this.name = name
    this.db = Database.instance()
  }

  save(entity) {
    if (!entity || !entity.id) {
      log('invalid entity %j', entity)
      throw new Error('invalid entity')
    }
    return this.db.put(`${this.name}-${entity.id}`, entity)
  }

  findOne(id) {
    return this.db.get(`${this.name}-${id}`)
  }

  deleteOne(id) {
    return this.db.del(`${this.name}-${id}`)
  }
}
