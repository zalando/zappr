import 'source-map-support/register'

import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import session from 'koa-generic-session'
import bodyParser from 'koa-bodyparser'
import convert from 'koa-convert'
import morgan from 'koa-morgan'
import Umzug from 'umzug'
import Sequelize from 'sequelize'
import nconf from './nconf'
import DatabaseStore from './session/database-store'
import { db } from './model'
import { init as initPassport } from './passport'
import { logger } from '../common/debug'

const log = logger('app')
const app = new Koa()
app.name = 'zappr'

// Trust proxy header fields.
app.proxy = true

// Sessions
app.keys = [nconf.get('SESSION_SECRET')]

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
const morganFormat = nconf.get('MORGAN_FORMAT')
const morganSkip = (req, res) => res.statusCode < nconf.get('MORGAN_THRESH')

/**
 * Initialize the Koa application instance.
 *
 * @param {Object} options - Application options
 * @param options.PassportStrategy - Authentication strategy
 * @returns {Application} Koa application
 */
export function init(options = {}) {
  const passport = initPassport(options.PassportStrategy)

  return app.
  use(morgan(morganFormat, {skip: morganSkip})).
  use(convert(session({store: store}))).
  use(bodyParser()).
  use(passport.initialize()).
  use(passport.session()).
  use(router.routes()).
  use(router.allowedMethods()).
  use(convert(serve(nconf.get('STATIC_DIR'), {index: 'none'}))).
  use(renderStatic)
}

/**
 * Run setup processes and start listening.
 *
 * @param {number} port Port to listen on
 */
async function start(port = nconf.get('APP_PORT')) {
  const umzug = new Umzug({
    storage: 'sequelize',
    logging: logger('migration', 'info'),
    migrations: {
      path: './migrations',
      pattern: /^\d+[\w-]+\.js$/,
      params: [db.queryInterface, Sequelize]
    },
    storageOptions: {
      // The configured instance of Sequelize.
      sequelize: db,
      // this one is actually undocumented
      schema: 'zappr_meta',
      // The name of the to be used model.
      // (not sure if we need this actually)
      modelName: 'SequelizeMeta',
      // The name of table to create if `model` option is not supplied
      tableName: 'migrations',
      // The name of table column holding migration name.
      columnName: 'migration',
      // The type of the column holding migration name.
      columnType: new Sequelize.TEXT
    }
  })
  // apply migrations
  await umzug.up()
  // sync models
  await db.sync()
  init().listen(port)
  log(`listening on port ${port}`)
}

if (require.main === module) {
  start()
  .catch(err => {
    log(err)
    process.exit(1)
  })
}
