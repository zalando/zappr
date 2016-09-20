import { Session } from '../model'

import { logger } from '../../common/debug'
const log = logger('session')

/**
 * Implements generic-session store:
 * https://github.com/koajs/generic-session#session-store
 */
export default class DatabaseStore {
  *get(sid) {
    log('get value for key %s', sid)
    return yield Session.findById(sid).then(session => session
      ? session.flatten()
      : null)
  }

  *set(sid, val) {
    log('set value with key %s', sid)
    // use update or insert instead of upsert
    // as upsert does not trigger any hooks until sequelize 4.0.0-1
    // https://github.com/sequelize/sequelize/blob/master/changelog.md
    const session = yield Session.findById(sid)
    return session ?
      yield Session.update({json: val}, {where: {id: sid}}) :
      yield Session.create({id: sid, json: val})
  }

  *destroy(sid) {
    log('destroy value with key %s', sid)
    return yield Session.destroy({where: {id: sid}})
  }
}
