import fetch from 'isomorphic-fetch'

import Service from './Service'
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

export default class CheckService extends Service {

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

      return response.json().then(json => {
        if (response.ok) {
          // Merge the argument with the server response so that we don't lose
          // important client-only attributes (e.g. isUpdating, etc.)
          return {...check, ...json}
        } else if (contentType === 'application/problem+json') {
          return Promise.reject(new CheckError(check, json))
        }
        return Promise.reject(new CheckError(check, {title: 'Unknown error', status: response.status}))
      })
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
      if (response.ok) {
        // response is empty when deleting checks
        return;
      }
      else if (contentType === 'application/problem+json') {
        return response.json().then(json => Promise.reject(new CheckError(check, json)))
      } else {
        return Promise.reject(new CheckError(check, {title: 'Unknown error', status: response.status}))
      }
    })
  }
}
