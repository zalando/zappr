import Problem from '../../common/Problem'
import { logger } from '../../common/debug'
const error = logger('api', 'error')

export default async function problemMiddleware(ctx, next) {
  try {
    await next()
  } catch (e) {
    error(e)
    ctx.response.set('Content-Type', 'application/problem+json')
    if (e.expose) {
      ctx.response.status = e.status || e.statusCode || 500
      const members = {
        status: e.status || e.statusCode || 500,
        title: e.message,
        detail: e.detail,
        instance: e.instance,
        type: e.type
      }
      const {status, title, detail, instance, type, ...extensions} = e
      const body = new Problem(members, extensions).toJSON()
      // remove some internals
      delete body.expose
      delete body.statusCode
      ctx.body = JSON.stringify(body) // if it's an object, the content-type will be overwritten
    } else {
      ctx.response.status = 500
      ctx.body = JSON.stringify({title: 'Internal server error', status: 500})
    }
  }
}
