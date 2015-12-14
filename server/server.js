import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import session from 'koa-generic-session'
import bodyParser from 'koa-bodyparser'
import passport from 'koa-passport'
import convert from 'koa-convert'

import {config} from './config'
import {health} from './routes/health'
import {authorize, login, logout} from './routes/auth.js'
import {env} from './routes/api'

export const app = new Koa()

// Trust proxy header fields.
app.proxy = true

// Sessions
app.keys = [config.get('SESSION_SECRET')]

// Routing
const router = [health, authorize, login, logout, env].
reduce((router, route) => route(router), Router())

app.
use(convert(session(app))).
use(bodyParser()).
use(passport.initialize()).
use(passport.session()).
use(router.routes()).
use(router.allowedMethods()).
use(convert(serve('dist/client')))

if (require.main === module) {
  app.listen(3000)
}
