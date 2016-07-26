import Problem from '../../common/Problem'
import { logger } from '../../common/debug'
import { symbolToString } from '../../common/util'
const error = logger('api', 'error')

const DEFAULT_TITLE = 'Internal server error'
const DEFAULT_STATUS = 500


export function generateProblemResponseFromAppError(e = {}) {
  const members = {
    status: e.status || e.statusCode || DEFAULT_STATUS,
    title: e.title || e.message || DEFAULT_TITLE,
    detail: e.detail || undefined,
    instance: e.instance || undefined,
    type: symbolToString(e.type)
  }
  const {status, title, detail, instance, type, ...extensions} = e
  const body = new Problem(members, extensions).toJSON()
  // remove some internals
  delete body.expose
  delete body.statusCode
  return body
}

export function generateProblemResponseFromKoaError(e) {
  const members = {status: e.status || DEFAULT_STATUS, title: e.expose ? e.message : DEFAULT_TITLE}
  const body = new Problem(members).toJSON()
  delete body.expose
  delete body.statusCode
  return body
}

export default function generateProblemMiddleware({exposableErrorTypes}) {
  return async function problemMiddleware(ctx, next) {
    try {
      await next()
    } catch (e) {
      error(e)
      let problem;
      if (e.type && exposableErrorTypes.indexOf(e.type) !== -1) {
        // only expose error details from github, check or repo handler
        problem = generateProblemResponseFromAppError(e)
      } else {
        problem = generateProblemResponseFromKoaError(e)
      }
      ctx.response.set('Content-Type', 'application/problem+json')
      ctx.response.status = problem.status
      // stringify to keep custom content type
      ctx.body = JSON.stringify(problem)
    }
  }

}
