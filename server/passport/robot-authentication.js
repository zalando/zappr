import nconf from 'nconf'
import { BasicStrategy } from 'passport-http'
import { logger } from '../../common/debug'

const info = logger('auth', 'info')

export const ROBOT_USER = '__ROBOT__' //  beep beep

function buildApiKeyStrategy() {
  const strategy = new BasicStrategy((user, passwd, done) => {
    const validKeys = nconf.get('APIKEYS')
    const authenticated = user === 'apikey' && validKeys.indexOf(passwd) !== -1
    if (!authenticated) {
      return done(new Error(`Unknown API Key "${passwd}"`))
    }
    return done(null, { id: ROBOT_USER }) // we don't have a robot user database
  })
  return { strategy, name: 'basic' }
}

function buildPlanBStrategy() {
  throw new Error('Plan B strategy not yet implemented')
}

function buildStrategy() {
  switch (nconf.get('ROBOT_AUTHENTICATION')) {
    case 'apikey':
      info('Using "apikey" strategy for robot users')
      return buildApiKeyStrategy()
    case 'planb':
      info('Using "planb" strategy for robot users')
      return buildPlanBStrategy()
    default:
      info('Not using any strategy for robot users')
      return null
  }
}

export default buildStrategy()
