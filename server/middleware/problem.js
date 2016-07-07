import Problem from '../../common/Problem'
import { logger } from '../../common/debug'
import {GITHUB_ERROR_TYPE} from '../service/GithubServiceError'
import {CHECK_ERROR_TYPE} from '../handler/CheckHandler'
import {REPO_ERROR_TYPE} from '../handler/RepositoryHandlerError'
const error = logger('api', 'error')

const DEFAULT_TITLE = 'Internal server error'
const DEFAULT_STATUS = 500


export function generateProblemResponseFromAppError(e = {}) {
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

export function generateProblemResponseFromKoaError(e) {
  const members = {status: e.status, title: e.message}
  const body = new Problem(members).toJSON()
  delete body.expose
  delete body.statusCode
  return body
}

const errorTypesToExpose = [GITHUB_ERROR_TYPE, REPO_ERROR_TYPE, CHECK_ERROR_TYPE]

export default async function problemMiddleware(ctx, next) {
  try {
    await next()
  } catch (e) {
    error(e)
    let problem;
    if (e.type && errorTypesToExpose.indexOf(e.type) !== -1) {
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
