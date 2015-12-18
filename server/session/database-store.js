import SessionRepository from '../persistence/session-repository'
import { logger } from '../../common/debug'

const log = logger('session')

export default class DatabaseStore {
  constructor() {
    this.repo = new SessionRepository()
  }

  *get(sid) {
    log('get value for key %s', sid)
    return yield this.repo.findOne(sid)
  }

  *set(sid, val) {
    log('set value with key %s', sid)
    return yield this.repo.save({id: sid, ...val})
  }

  *destroy(sid) {
    log('destroy value with key %s', sid)
    return yield this.repo.deleteOne(sid)
  }
}
