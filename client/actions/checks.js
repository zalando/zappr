import CheckService from '../service/CheckService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const PUT_CHECK = Symbol('put check')
export const DELETE_CHECK = Symbol('delete check')

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

function refreshToken(status, payload = null) {
  return {
    type: REFRESH_TOKEN,
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

function updateTokenForChecks(repo){
  return (dispatch) => {
    dispatch(refreshToken(PENDING, {}))
    CheckService.refreshTokens(repo.id)
                .then(() => dispatch(refreshToken(SUCCESS, check)))
                .catch(err => dispatch(refreshToken(ERROR, err)))
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

export function updateToken(repo) {
  if(repo) {
    return updateTokenForChecks(repo)
  } else {
    return {}
  }
}