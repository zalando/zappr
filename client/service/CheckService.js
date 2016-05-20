import fetch from 'isomorphic-fetch'

import Service from './Service'
import { ResponseProblem } from '../../common/Problem'
import { logger } from '../../common/debug'

const log = logger('CheckService')

class CheckError extends Error {
  /**
   * @param {Object} check
   * @param {Problem} problem
   */
  constructor(check, problem) {
    super(problem.title)
    this.repoId = check.repoId
    this.checkId = check.checkId
    this.type = check.type
    this.status = problem.status
    this.title = problem.title
    this.detail = problem.detail
  }
}

export default class RepoService extends Service {

  static enableCheck(check) {
    log('enable check %o', check)
    return fetch(Service.url(`/api/repos/${check.repoId}/${check.type}`), {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    }).then(response => {
      const contentType = response.headers.get('Content-Type') || ''

      if (response.ok) {
        // Merge the argument with the server response so that we don't lose
        // important client-only attributes (e.g. isUpdating, etc.)
        return response.json().then(json => ({...check, ...json}))
      }
      else if (contentType.startsWith('application/json')) {
        return response.json().then(json => Promise.reject(new CheckError(check, json)))
      }
      else {
        throw new CheckError(check, new ResponseProblem(response))
      }
    })
  }

  static disableCheck(check) {
    log('disable check %o', check)
    return fetch(Service.url(`/api/repos/${check.repoId}/${check.type}`), {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    }).then(response => {
      const contentType = response.headers.get('Content-Type') || ''

      if (!response.ok && contentType.startsWith('application/json')) {
        return response.json().then(json => Promise.reject(new CheckError(check, json)))
      }
      else if (!response.ok) {
        throw new CheckError(check, new ResponseProblem(response))
      }
    })
  }
}
