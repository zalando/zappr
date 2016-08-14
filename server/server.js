import 'source-map-support/register'

import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import session from 'koa-generic-session'
import bodyParser from 'koa-bodyparser'
import convert from 'koa-convert'
import morgan from 'koa-morgan'
import initMetrics from './metrics'
import generateProblemMiddleware from './middleware/problem'
import generatePrometheusMiddleware from './middleware/prometheus'
import Umzug from 'umzug'
import Sequelize from 'sequelize'
import nconf from './nconf'
import DatabaseStore from './session/database-store'
import { db } from './model'
import { init as initPassport } from './passport/passport'
import { logger } from '../common/debug'
import { GITHUB_ERROR_TYPE } from './service/GithubServiceError'
import { CHECK_ERROR_TYPE } from './handler/CheckHandlerError'
import { REPO_ERROR_TYPE } from './handler/RepositoryHandlerError'

const log = logger('app', 'info')
const app = new Koa()
app.name = 'zappr'

// Trust proxy header fields.
app.proxy = true

// Sessions
app.keys = [nconf.get('SESSION_SECRET')]

// Routing
import { health } from './routes/health'
import { authorize, login, logout, changeMode, ensureModeMiddleware } from './routes/auth.js'
import { env, repos, repo } from './routes/api'
import renderStatic from './react/render-static.jsx'

const router = [health, authorize, login, logout, changeMode, env, repos, repo].
reduce((router, route) => route(router), Router())

// Session store
const store = new DatabaseStore()

// HTTP logs
const morganFormat = nconf.get('MORGAN_FORMAT')
const morganSkip = (req, res) => res.statusCode < nconf.get('MORGAN_THRESH')

/**
 * Initialize the Koa application instance.
 *
 * @param {object} - Application options
 * @returns {Application} Koa application
 */
export function init(options = {}) {
  const passport = initPassport(options.PassportStrategy)

  return app.use(generatePrometheusMiddleware(router, {
              ignore: [/^\/repository/]
            }))
            .use(generateProblemMiddleware({
              exposableErrorTypes: [
                CHECK_ERROR_TYPE,
                GITHUB_ERROR_TYPE,
                REPO_ERROR_TYPE
              ]
            }))
            .use(morgan(morganFormat, {skip: morganSkip}))
            .use(convert(session({store: store})))
            .use(bodyParser())
            .use(passport.initialize())
            .use(passport.session())
            .use(router.routes())
            .use(router.allowedMethods())
            .use(convert(serve(nconf.get('STATIC_DIR'), {index: 'none'})))
            .use(ensureModeMiddleware)
            .use(renderStatic)
}

/**
 * Run setup processes and start listening.
 *
 * @param {number} port Port to listen on
 */
async function start(port = nconf.get('APP_PORT'), opts = {
  metricsEnabled: nconf.get('METRICS_ENABLED'),
  metricsPort: nconf.get('METRICS_PORT')
}) {
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
  /**
   * Syncing models (db.sync()) is basically CREATE TABLE for every model.
   *
   * Now, the thing about sequelize + umzug is:
   *   - if you have a completely new, mostly independent model (say n:1 with an existing model),
   *     you don't have to write a migration for it, as CREATE TABLE will be covered by newModel.sync()
   *   - if you have a model that requires changes to another model (1:n with existing model),
   *     you have to write a migration for it, because the table already exists
   *   - if you start the app now on a clean database, I suppose either of the two happens:
   *     - migrations fail because tables do not exist yet (when running umzug prior to db.sync())
   *     - migrations fail because columns already exist (when running umzug after db.sync())
   *
   * The solution, I guess, is to write every database change as an umzug migration,
   * thus losing the comfort of model.sync(). However since Zappr is already running since
   * half a year, this cannot be achieved without fiddling directly on the migrations table.
   */
  await db.sync()
  init().listen(port)
  log(`listening on port ${port}`)
  if (opts.metricsEnabled) {
    const actualMetricsPort = opts.metricsPort || 3003
    initMetrics().listen(actualMetricsPort)
    log(`metrics available on port ${actualMetricsPort}`)
  }
}

if (require.main === module) {
  start()
  .catch(err => {
    log(err)
    process.exit(1)
  })
}
