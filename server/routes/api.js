import request from 'request'

import config from '../config'
import RepoRepository from '../persistence/repo-repository'
import { requireAuth } from './auth'
import { logger } from '../../common/debug'

const repoRepository = new RepoRepository()
const log = logger('api')

/**
 * Environment variables endpoint.
 */
export function env(router) {
  return router.get('/api/env', requireAuth, ctx => {
    ctx.body = {
      'NODE_ENV': config.get('NODE_ENV')
    }
  })
}

function githubRequest(ctx, path) {
  const options = {
    url: config.get('GITHUB_URL') + path,
    headers: {
      'User-Agent': 'ZAPPR/1.0 (+https://zappr.hackweek.zalan.do)',
      'Authorization': `token ${ctx.req.user.accessToken}`
    }
  }
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      const {statusCode} = response
      if (err) return reject(err)
      if (statusCode !== 200) return reject(statusCode)
      else resolve(JSON.parse(body))
    })
  })
}

export function repos(router) {
  return router.get('/api/repos', requireAuth, async (ctx) => {
    const repos = await githubRequest(ctx, '/user/repos')
    const result = await Promise.all(repos.map(async (remoteRepo) => {
      const localRepo = await repoRepository.findOne(remoteRepo.id)
      return {...remoteRepo, ...localRepo}
    }))
    ctx.response.type = 'application/json'
    ctx.body = result
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

export function repo(router) {
  return router.
  get('/api/repos/:id', requireAuth, async (ctx) => {
    const result = await Promise.all([
      repoRepository.findOne(ctx.params.id),
      githubRequest(ctx, '/user/repos').
      then(repos => repos.find(repo => repo.id == ctx.params.id))
    ]).
    then(([localRepo, remoteRepo]) => {
      return {...remoteRepo, ...localRepo}
    }).
    catch(e => ctx.throw(e))

    ctx.response.type = 'application/json'
    ctx.body = result
  }).
  put('/api/repos/:id', requireAuth, validateRepo, async (ctx) => {
    const id = ctx.params.id
    const repo = ctx.request.body

    ctx.response.body = await repoRepository.save({id, ...repo})
    ctx.response.type = 'application/json'
    ctx.response.status = 202
  })
}
