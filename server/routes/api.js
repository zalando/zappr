import nconf from '../nconf'
import { requireAuth } from './auth'
import { Repository } from '../model'
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

    const {accessToken} = ctx.req.user
    const refresh = ctx.params.refresh == 'true'
    const repos = await repositoryHandler.onGetAll(accessToken, refresh)

    ctx.response.type = 'application/json'
    ctx.body = repos
  })
}

/**
 * Middleware to validate repo data structure.
 */
export function validateRepo(ctx, next) {
  const { body } = ctx.request
  if (typeof body === 'object'
    && Object.keys(body).length > 0
    && typeof body.zapprEnabled !== 'undefined') {
    return next()
  } else {
    log('validation error for', body)
    ctx.throw(406)
  }
}

/**
 * Single repository.
 * TODO: put logic into RepositoryHandler
 */
export function repo(router) {
  return router.
  get('/api/repos/:id', requireAuth, async (ctx) => {
    const repoId = parseInt(ctx.params.id)
    const repoData = await Repository.findById(repoId)
      .then(repository => repository ? repository.get('json') : null)
      .then(json => JSON.parse(json))
      .catch(err => ctx.throw(err))

    if (!repoData) ctx.throw(404)

    ctx.response.type = 'application/json'
    ctx.body = {id: repoId, ...repoData}
  }).
  put('/api/repos/:id', requireAuth, validateRepo, async (ctx) => {
    const repoId = parseInt(ctx.params.id)
    const {id, ...repoData} = ctx.request.body

    const localRepo = await Repository.findById(repoId)
      .then(repository => repository ? repository.get('json') : null)
      .then(json => JSON.parse(json))
      .catch(err => ctx.throw(err))

    if (!localRepo) ctx.throw(404)

    const mergedData = {...localRepo, ...repoData}

    await Repository.upsert({
      id: repoId,
      json: mergedData
    })

    ctx.response.body = ({id: repoId, ...mergedData})
    ctx.response.type = 'application/json'
    ctx.response.status = 202
  })
}
