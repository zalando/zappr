import level from 'level'
import { logger } from '../../common/debug'

const log = logger('session')

export default class LevelStore {
  constructor(db) {
    this.db = level(db, {valueEncoding: 'json'})
  }

  *get(sid) {
    log('get value for key %s', sid)

    return yield new Promise((resolve, reject) => {
      this.db.get(sid, (err, value) => {
        if (err && err.notFound) resolve(null)
        else if (err) reject(err)
        else resolve(value)
      })
    })
  }

  *set(sid, val) {
    log('set value with key %s', sid)

    return yield new Promise((resolve, reject) => {
      this.db.put(sid, val, (err, value) =>
        err ? reject(err) : resolve(value))
    })
  }

  *destroy(sid) {
    log('destroy value with key %s', sid)

    return yield new Promise((resolve, reject) => {
      this.db.del(sid, err =>
        err ? reject(err) : resolve())
    })
  }
}
