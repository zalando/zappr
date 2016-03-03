import nconf from '../nconf'
import { requireAuth } from './auth'
import { hookHandler } from '../handler/HookHandler'
import { repositoryHandler } from '../handler/RepositoryHandler'

import { logger } from '../../common/debug'
const log = logger('api')

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
      log(e)
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
      log(e)
      ctx.throw(e)
    }
  }).
  post('/api/hook', async (ctx) => {
    const hookResult = await hookHandler.onHandleHook(ctx.request.body)
    ctx.response.type = 'application/json'
    ctx.response.status = 200
    ctx.response.body = hookResult
  })
}
