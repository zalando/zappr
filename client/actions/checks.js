import CheckService from '../service/CheckService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'
import { requestReposIfNeeded } from '../actions/repos'

export const PUT_CHECK = Symbol('put check')
export const DELETE_CHECK = Symbol('delete check')
export const REFRESH_TOKEN = Symbol('refresh token')
export const RELOAD_REPO_DETAIL = Symbol ('reload repo detail')


function putCheck(status, payload = null) {
  return {
    type: PUT_CHECK,
    status,
    payload
  }
}

function deleteCheck(status, payload = null) {
  return {
    type: DELETE_CHECK,
    status,
    payload
  }
}

function enableCheck(check) {
  return (dispatch) => {
    dispatch(putCheck(PENDING, check))
    CheckService.enableCheck(check)
                .then(json => dispatch(putCheck(SUCCESS, json)))
                .catch(err => dispatch(putCheck(ERROR, err)))
  }
}

function disableCheck(check) {
  return (dispatch) => {
    dispatch(putCheck(PENDING, check))
    CheckService.disableCheck(check)
                .then(() => dispatch(deleteCheck(SUCCESS, check)))
                .catch(err => dispatch(deleteCheck(ERROR, err)))
  }
}

/**
 * Enable or disable a check for a particular repo.
 *
 * @param {object} check
 */
export function toggleCheck(check) {
  if (check.isEnabled) {
    return enableCheck(check)
  } else {
    return disableCheck(check)
  }
}

function refreshToken(status, payload = null) {
  return {
    type: REFRESH_TOKEN,
    status,
    payload
  }
}

function updateTokenForChecks(repo, reloadReposFn){
  return (dispatch) => {
    dispatch(refreshToken(PENDING, {}))
    CheckService.refreshTokens(repo.id)
                .then((successMsg) => {
                  dispatch(refreshToken(SUCCESS, successMsg))
                  dispatch(reloadReposFn(true))
                })
                .catch(err => dispatch(refreshToken(ERROR, err)))
  }
}

/**
 * Refresh access token with new user logged in (1% case)
 * @param {*} repo - repository data
 */
export function requestRefreshToken(repo, reloadReposFn) {
  if(repo) {
    return updateTokenForChecks(repo, reloadReposFn)
  } else {
    return {}
  }
} 