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
    return yield Session.findById(sid)
      .then(session => session ? session.get('json') : null)
      .then(json => JSON.parse(json))
  }

  *set(sid, val) {
    log('set value with key %s', sid)
    return yield Session.upsert({id: sid, json: val})
  }

  *destroy(sid) {
    log('destroy value with key %s', sid)
    return yield Session.destroy({where: {id: sid}})
  }
}
