import nconf from '../nconf'
import request from 'request'

import { requireAuth } from './auth'
import { Repository } from '../model'

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

function githubRequest(ctx, path) {
  const options = {
    url: nconf.get('GITHUB_URL') + path,
    headers: {
      'User-Agent': 'ZAPPR/1.0 (+https://zappr.hackweek.zalan.do)',
      'Authorization': `token ${ctx.req.user.accessToken}`
    }
  }
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      const {statusCode} = response || {}
      if (err) return reject(err)
      if (statusCode !== 200) return reject(new Error(statusCode))
      else resolve(JSON.parse(body))
    })
  })
}

export function repos(router) {
  return router.get('/api/repos', requireAuth, async (ctx) => {

    let repositories = await Repository.findAll()
      .then(repos => repos.map(repo => ({
        id: repo.id,
        ...JSON.parse(repo.get('json'))
      })))
      .catch(err => ctx.throw(err))

    if (repositories.length < 1 || ctx.params.refresh == 'true') {
      log('refresh repositories from Github API...')
      repositories = await githubRequest(ctx, '/user/repos')
        .then(repos => repos.map(remoteRepo => ({
          ...remoteRepo,
          ...repositories.find(localRepo => localRepo.id === remoteRepo.id)
        })))

      log('update repositories in database...')
      await Promise.all(repositories.map(repo => {
        const {id, ...repoData} = repo
        return Repository.upsert({
          id,
          json: repoData
        }).
        catch(err => ctx.throw(err))
      }))
    }

    ctx.response.type = 'application/json'
    ctx.body = repositories
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
