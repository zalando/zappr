import Problem from '../../common/Problem'
import { logger } from '../../common/debug'
const error = logger('api', 'error')

const DEFAULT_TITLE = 'Internal server error'
const DEFAULT_STATUS = 500

export function generateProblemResponseFrom(e = {}) {
  if (e.expose) {
    const members = {
      status: e.status || e.statusCode || DEFAULT_STATUS,
      title: e.title || e.message || DEFAULT_TITLE,
      detail: e.detail || undefined,
      instance: e.instance || undefined,
      type: e.type || undefined
    }
    const {status, title, detail, instance, type, ...extensions} = e
    const body = new Problem(members, extensions).toJSON()
    // remove some internals
    delete body.expose
    delete body.statusCode
    return body
  }
  return new Problem({ status: DEFAULT_STATUS, title: DEFAULT_TITLE }).toJSON()
}

export default async function problemMiddleware(ctx, next) {
  try {
    await next()
  } catch (e) {
    error(e)
    ctx.response.set('Content-Type', 'application/problem+json')
    const problem = generateProblemResponseFrom(e)
    ctx.response.status = problem.status
    // stringify to keep custom content type
    ctx.body = JSON.stringify(problem)
  }
}
