import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import session from 'koa-generic-session'
import bodyParser from 'koa-bodyparser'
import passport from 'koa-passport'
import convert from 'koa-convert'
import morgan from 'koa-morgan'

import DatabaseStore from './session/database-store'
import { syncModel } from './model'
import config from './config'

import { logger } from '../common/debug'
const log = logger('app')

export const app = new Koa()

// Trust proxy header fields.
app.proxy = true

// Sessions
app.keys = [config.get('SESSION_SECRET')]

// Routing
import { health } from './routes/health'
import { authorize, login, logout } from './routes/auth.js'
import { env, repos, repo } from './routes/api'
import renderStatic from './react/render-static.jsx'

const router = [health, authorize, login, logout, env, repos, repo].
reduce((router, route) => route(router), Router())

// Session store
const store = new DatabaseStore()

// HTTP logs
const morganFormat = config.get('MORGAN_FORMAT')
const morganSkip = (req, res) => res.statusCode < config.get('MORGAN_THRESH')

app.
use(morgan(morganFormat, {skip: morganSkip})).
use(convert(session({store: store}))).
use(bodyParser()).
use(passport.initialize()).
use(passport.session()).
use(router.routes()).
use(router.allowedMethods()).
use(convert(serve(config.get('STATIC_DIR'), {index: 'none'}))).
use(renderStatic)

async function init() {
  await syncModel()
  const port = config.get('APP_PORT')
  app.listen(port)
  log(`listening on port ${port}`)
}

if (require.main === module) init()
