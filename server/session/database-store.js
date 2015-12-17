import { Database } from '../persistence'
import { logger } from '../../common/debug'

const log = logger('session')

export default class DatabaseStore {
  constructor() {
    this.db = Database.instance()
  }

  *get(sid) {
    log('get value for key %s', sid)
    return yield this.db.get(sid)
  }

  *set(sid, val) {
    log('set value with key %s', sid)
    return yield this.db.put(sid, val)
  }

  *destroy(sid) {
    log('destroy value with key %s', sid)
    return yield this.db.del(sid)
  }
}
