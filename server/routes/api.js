import crypto from 'crypto'
import url from 'url'
import qs from 'qs'
import nconf from '../nconf'
import { githubService } from '../service/GithubService'
import { requireAuth } from './auth'
import { hookHandler } from '../handler/HookHandler'
import { checkRunner } from '../checks/CheckRunner'
import { checkHandler } from '../handler/CheckHandler'
import { repositoryHandler } from '../handler/RepositoryHandler'
import ZapprConfiguration from '../zapprfile/Configuration'
import { getCheckByType } from '../checks'
import { logger } from '../../common/debug'

const error = logger('api', 'error')
const warn = logger('api', 'warn')
const info = logger('api', 'info')
const NODE_ENV = nconf.get('NODE_ENV')
const PROD_ENV = 'production'
const GITHUB_HOOK_SECRET = nconf.get('GITHUB_HOOK_SECRET')
const GITHUB_SIGNATURE_HEADER = 'x-hub-signature'
const GITHUB_EVENT_HEADER = 'x-github-event'

function validateIsCalledFromGithub(ctx, next) {
  const {header, body} = ctx.request
  const actualSignature = header[GITHUB_SIGNATURE_HEADER]
  // not require signature header for backwards compatibility
  if (!actualSignature) {
    warn(`Request from host ${header.host} is missing X-Hub-Signature header!`)
    return next()
  }
  const sha1 = crypto.createHmac('sha1', GITHUB_HOOK_SECRET)
  // use buffer otherwise unicde (emojis! 💩) break the hash
  const hmac = sha1.update(new Buffer(JSON.stringify(body))).digest('hex')
  const expectedSignature = `sha1=${hmac}`
  if (actualSignature !== expectedSignature) {
    error(`Hook for ${body.repository.full_name} called with invalid signature "${actualSignature}"`
      + `(expected: "${expectedSignature}") from ${header.host}!`)
    ctx.throw(400)
  }

  return next()
}

/**
 * Environment variables endpoint.
 */
export function env(router) {
  return router.get('/api/env', requireAuth, ctx => {
    ctx.body = {
      'NODE_ENV': nconf.get('NODE_ENV')
    }
  })
}

/**
 * Repository collection.
 */
export function repos(router) {
  return router.get('/api/repos', requireAuth, async(ctx) => {
    try {
      const user = ctx.req.user
      const all = ctx.request.query.all == 'true'
      const repos = await repositoryHandler.onGetAll(user, all)
      ctx.body = repos.map(repo => repo.toJSON())
    } catch (e) {
      ctx.throw(503, e)
    }
  })
}

/**
 * Single repository.
 */
export function repo(router) {
  return router
  .get('/api/repos/:id', requireAuth, async(ctx) => {
    try {
      const query = qs.parse(url.parse(ctx.req.url).query)
      const user = ctx.req.user
      const id = parseInt(ctx.params.id)
      const autoSync = query.autoSync === 'true'
      const repo = await repositoryHandler.onGetOne(id, user, false, autoSync)
      ctx.body = repo
    } catch (e) {
      ctx.throw(404, e)
    }
  })
  .get('/api/repos/:id/zapprfile', requireAuth, async(ctx) => {
    const user = ctx.req.user
    const id = parseInt(ctx.params.id, 10)
    let repo
    try {
      repo = await repositoryHandler.onGetOne(id, user, true)
    } catch (e) {
      ctx.throw(404, e)
    }
    const zapprFileContent = await githubService.readZapprFile(repo.json.owner.login, repo.json.name, user.accessToken)
    const config = new ZapprConfiguration(zapprFileContent, repo)

    const message = zapprFileContent === '' ?
      'No Zapprfile found, using default config' :
      (config.isValid() ?
        '' :
        config.getParseError())

    ctx.body = {
      config: config.getConfiguration(),
      message,
      valid: config.isValid()
    }
    ctx.response.status = 200
  })
  .put('/api/repos/:id/:type', requireAuth, async(ctx) => {
    try {
      const user = ctx.req.user
      const id = parseInt(ctx.params.id)
      const type = ctx.params.type
      const repo = await repositoryHandler.onGetOne(id, user, true)
      const token = user.accessToken
      const owner = repo.json.owner.login
      const name = repo.json.name
      const defaultBranch = repo.json.default_branch
      const zapprFile = await githubService.readZapprFile(owner, name, token)
      if (!repo.welcomed) {
        try {
          if (zapprFile.length === 0) {
            await githubService.proposeZapprfile(owner, name, defaultBranch, token)
            info(`${owner}/${name}: Welcome to Zappr.`)
          } else {
            info(`${owner}/${name}: Welcome to Zappr (no PR needed).`)
          }
          await repositoryHandler.onWelcome(id)
        } catch (e) {
          error(`${owner}/${name}: Could not welcome. ${e.message}`)
        }
      }
      const check = await checkHandler.onEnableCheck(user, repo, type)
      const checkContext = getCheckByType(type).CONTEXT
      if (checkContext) {
        // autobranch doesn't have a context
        const config = new ZapprConfiguration(zapprFile, repo)
        if (NODE_ENV !== PROD_ENV) {
          // blocking in dev and tests
          await githubService.protectBranch(owner, name, defaultBranch, checkContext, token)
          await checkRunner.handleExistingPullRequests(repo, getCheckByType(type).TYPE, {config: config.getConfiguration(), token})
        } else {
          // not blocking in production
          githubService.protectBranch(owner, name, defaultBranch, checkContext, token)
          checkRunner.handleExistingPullRequests(repo, getCheckByType(type).TYPE, {config: config.getConfiguration(), token})
        }
      }
      ctx.response.status = 201
      ctx.body = check.toJSON()
    } catch (e) {
      ctx.throw(503, e)
    }
  })
  .delete('/api/repos/:id/:type', requireAuth, async(ctx) => {
    try {
      const user = ctx.req.user
      const id = parseInt(ctx.params.id)
      const repo = await repositoryHandler.onGetOne(id, user)
      const type = ctx.params.type
      const checkContext = getCheckByType(type).CONTEXT
      // check first if user has permissions 
      if (checkContext) {
        if (NODE_ENV !== PROD_ENV) {
          try {
            // block when not in prod
            // => so we can test the API calls
            await checkRunner.release(repo, type, user.accessToken)
            await githubService.removeRequiredStatusCheck(repo.json.owner.login, repo.json.name, repo.json.default_branch, checkContext, user.accessToken)
          } catch (e) {
            ctx.throw(503, e)
            error(`${repo.json.full_name}: Could not remove status check. ${e.detail}`)
          }
        } else {
          // BugFix machinery/zappr-deploy/issues/14 (Zalando internal reference)
          // https://github.com/zalando/zappr/pull/560/
          // not block when in prod
          try {
            checkRunner.release(repo, type, user.accessToken)
              .catch(e => error(`${repo.json.full_name} [${type}]: Could not release pull requests. ${e.message}`))
            await githubService.removeRequiredStatusCheck(repo.json.owner.login, repo.json.name, repo.json.default_branch, checkContext, user.accessToken)
          } catch (e) {
            ctx.throw(503, e)
            error(`${repo.json.full_name}: Could not remove status check. ${e.detail}`)
          }
        }
      }
      await checkHandler.onDisableCheck(user, repo, type)
      ctx.response.status = 204
      ctx.body = null
    } catch (e) {
      ctx.throw(503, e)
    }
  })
  .post('/api/hook', validateIsCalledFromGithub, async(ctx) => {
    const {header, body} = ctx.request
    const event = header[GITHUB_EVENT_HEADER]
    const hookResult = await hookHandler.onHandleHook(event, body)
    ctx.response.status = 200
    ctx.body = hookResult
  })
}
