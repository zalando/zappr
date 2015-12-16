import { config } from '../config'
import { requireAuth } from './auth'

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
