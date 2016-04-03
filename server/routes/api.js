import nconf from '../nconf'
import { requireAuth } from './auth'
import { hookHandler } from '../handler/HookHandler'
import { repositoryHandler } from '../handler/RepositoryHandler'
import crypto from 'crypto'
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
  const hmac = sha1.update(JSON.stringify(body)).digest('hex')
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
  return router.get('/api/repos', requireAuth, async (ctx) => {
    const user = ctx.req.user
    const all = ctx.request.query.all == 'true'
    const repos = await repositoryHandler.onGetAll(user, all)

    ctx.response.type = 'application/json'
    ctx.body = repos
  })
}

/**
 * Single repository.
 */
export function repo(router) {
  return router.
  get('/api/repos/:id', requireAuth, async (ctx) => {
    const user = ctx.req.user
    const id = parseInt(ctx.params.id)
    const repo = await repositoryHandler.onGetOne(id, user)

    if (!repo) ctx.throw(404)
    ctx.response.type = 'application/json'
    ctx.body = repo
  }).
  put('/api/repos/:id/:type', requireAuth, async (ctx) => {
    const user = ctx.req.user
    const id = parseInt(ctx.params.id)
    const type = ctx.params.type
    const repo = await repositoryHandler.onGetOne(id, user)
    try {
      await hookHandler.onEnableCheck(user, repo, type)
      ctx.response.status = 201
    } catch (e) {
      error(e)
      ctx.throw(e)
    }
  }).
  delete('/api/repos/:id/:type', requireAuth, async (ctx) => {
    const user = ctx.req.user
    const id = parseInt(ctx.params.id)
    const repo = await repositoryHandler.onGetOne(id, user)
    const type = ctx.params.type
    try {
      await hookHandler.onDisableCheck(user, repo, type)
      ctx.response.status = 200
    } catch(e) {
      error(e)
      ctx.throw(e)
    }
  }).
  post('/api/hook', validateIsCalledFromGithub, async (ctx) => {
    const {header, body} = ctx.request
    const event = header[GITHUB_EVENT_HEADER]
    const hookResult = await hookHandler.onHandleHook(event, body)
    ctx.response.type = 'application/json'
    ctx.response.status = 200
    ctx.response.body = hookResult
  })
}
