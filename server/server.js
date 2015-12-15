import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import session from 'koa-generic-session'
import bodyParser from 'koa-bodyparser'
import passport from 'koa-passport'
import convert from 'koa-convert'
import morgan from 'koa-morgan'

import { config } from './config'
import { logger } from '../common/debug'

export const app = new Koa()

// Trust proxy header fields.
app.proxy = true

// Sessions
app.keys = [config.get('SESSION_SECRET')]

// Routing
import {health} from './routes/health'
import {authorize, login, logout} from './routes/auth.js'
import {env} from './routes/api'

const router = [health, authorize, login, logout, env].
reduce((router, route) => route(router), Router())

// Logging
const LOG_FORMAT = config.get('LOG_FORMAT')
const log = logger('app')

app.
use(morgan(LOG_FORMAT)).
use(convert(session(app))). // TODO: use persistent Session Store
use(bodyParser()).
use(passport.initialize()).
use(passport.session()).
use(router.routes()).
use(router.allowedMethods()).
use(convert(serve('dist/client')))

if (require.main === module) {
  const port = config.get('APP_PORT')
  app.listen(port)
  log(`listening on port ${port}`)
}
