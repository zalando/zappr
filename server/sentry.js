import { Client, transports } from 'raven'

import nconf from './nconf'
import { logger } from '../common/debug'

const debug = logger('sentry', 'debug')
const warn = logger('sentry', 'warn')

const SENTRY_PUBLIC_KEY = nconf.get('SENTRY_PUBLIC_KEY')
const SENTRY_SECRET_KEY = nconf.get('SENTRY_SECRET_KEY')
const SENTRY_APP_ID = nconf.get('SENTRY_APP_ID')
const SENTRY_HOST = 'app.getsentry.com'
const IS_PRODUCTION = nconf.get('NODE_ENV') === 'production'
const APP_VERSION = nconf.get('APP_VERSION')

const ENABLE_SENTRY = SENTRY_PUBLIC_KEY && SENTRY_SECRET_KEY && SENTRY_APP_ID
const ENABLE_RAVEN_DSN = IS_PRODUCTION && ENABLE_SENTRY
const RAVEN_DSN = `https://${SENTRY_PUBLIC_KEY}:${SENTRY_SECRET_KEY}@${SENTRY_HOST}/${SENTRY_APP_ID}`

class OfflineTransport extends transports.Transport {
  send(client, message, headers, ident) {
    warn('using sentry in offline mode')
    debug('%j %j', ident, headers)
  }
}

// Either use the default transport or our custom one.
const transport = ENABLE_RAVEN_DSN ? null : new OfflineTransport()
const sentry = new Client(RAVEN_DSN, {transport, release: APP_VERSION})

export default sentry
