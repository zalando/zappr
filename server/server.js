import 'source-map-support/register'

import Koa from 'koa'
import Router from 'koa-router'
import serve from 'koa-static'
import session from 'koa-generic-session'
import bodyParser from 'koa-bodyparser'
import convert from 'koa-convert'
import morgan from 'koa-morgan'
import etag from 'koa-etag'
import compress from 'koa-compress'
import conditional from 'koa-conditional-get'
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

const router = [
  health,
  authorize,
  login,
  logout,
  changeMode,
  env,
  repos,
  repo].reduce((router, route) => route(router), Router())

// Session store
const store = new DatabaseStore()

// HTTP logs
const morganFormat = nconf.get('MORGAN_FORMAT')
const morganSkip = (req, res) => res.statusCode < nconf.get('MORGAN_THRESH')

/**
 * Initialize the Koa application instance.
 *
 * @param options {object} - Application options
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
            .use(compress())
            .use(router.routes())
            .use(router.allowedMethods())
            .use(conditional())
            .use(etag())
            .use(serve(
              nconf.get('STATIC_DIR'), {
                index: 'none',
                maxage: 1.7 * 10 ** 8 // ~ 2 days
              }))
            .use(ensureModeMiddleware)
            .use(renderStatic)
}

/**
 * Run setup processes and start listening.
 *
 * @param {number} port Port to listen on
 * @param {object} opts Options for metrics
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
  await db.createSchemas()
  // apply migrations
  await umzug.up({from: nconf.get('DB_UMZUG_FROM') || null})
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
