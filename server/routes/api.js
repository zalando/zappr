import request from 'request'

import config from '../config'
import { requireAuth } from './auth'
import { logger } from '../../common/debug'

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
      if (err) return reject(err)
      resolve(body)
    })
  })
}

export function repos(router) {
  return router.get('/api/repos', requireAuth, async (ctx) => {
    ctx.response.type = 'application/json'
    ctx.body = await githubRequest(ctx, '/user/repos')
  })
}
