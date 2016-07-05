import crypto from 'crypto'
import nconf from '../nconf'
import { requireAuth } from './auth'
import { hookHandler } from '../handler/HookHandler'
import { checkHandler } from '../handler/CheckHandler'
import { repositoryHandler } from '../handler/RepositoryHandler'
import { logger } from '../../common/debug'

const error = logger('api', 'error')
const warn = logger('api', 'warn')
const info = logger('api', 'info')
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

      ctx.response.type = 'application/json'
      ctx.body = repos.map(repo => repo.toJSON())
    } catch (e) {
      ctx.throw(500, 'Could not fetch repositories.', e)
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
      const user = ctx.req.user
      const id = parseInt(ctx.params.id)
      const repo = await repositoryHandler.onGetOne(id, user)
      ctx.response.type = 'application/json'
      ctx.body = repo
    } catch (e) {
      ctx.throw(404, 'Repository not found', e)
    }
  })
  .put('/api/repos/:id/:type', requireAuth, async(ctx) => {
    try {
      const user = ctx.req.user
      const id = parseInt(ctx.params.id)
      const type = ctx.params.type
      const repo = await repositoryHandler.onGetOne(id, user)
      const check = await checkHandler.onEnableCheck(user, repo, type)
      ctx.response.type = 'application/json'
      ctx.response.status = 201
      ctx.body = check.toJSON()
    } catch (e) {
      ctx.throw(500, 'Could not enable check.', e)
    }
  })
  .delete('/api/repos/:id/:type', requireAuth, async(ctx) => {
    try {
      const user = ctx.req.user
      const id = parseInt(ctx.params.id)
      const repo = await repositoryHandler.onGetOne(id, user)
      const type = ctx.params.type
      await checkHandler.onDisableCheck(user, repo, type)
      ctx.response.status = 204
      ctx.body = null
    } catch (e) {
      ctx.throw(500, 'Could not disable check.', e)
    }
  })
  .post('/api/hook', validateIsCalledFromGithub, async(ctx) => {
    const {header, body} = ctx.request
    const event = header[GITHUB_EVENT_HEADER]
    const hookResult = await hookHandler.onHandleHook(event, body)
    ctx.response.type = 'application/json'
    ctx.response.status = 200
    ctx.body = hookResult
  })
}
