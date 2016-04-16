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

function enableCheck(check) {
  return (dispatch) => {
    dispatch(putCheck(PENDING, check))
    CheckService.enableCheck(check)
                .then(() => dispatch(putCheck(SUCCESS, check)))
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
