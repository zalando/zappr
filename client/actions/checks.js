import CheckService from '../service/CheckService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const PUT_CHECK = Symbol('put check')
export const DELETE_CHECK = Symbol('delete check')

const putCheck = (status, check, payload = null) => ({
  type: PUT_CHECK,
  status,
  check,
  payload
})

const deleteCheck = (status, check, payload = null) => ({
  type: DELETE_CHECK,
  status,
  check,
  payload
})

function enableCheck(check) {
  return (dispatch) => {
    dispatch(putCheck(PENDING, check.type, check))
    CheckService.enableCheck(check).
      then(() => dispatch(putCheck(SUCCESS, check.type, check))).
      catch(err => dispatch(putCheck(ERROR, check.type, err)))
  }
}

function disableCheck(check) {
  return (dispatch) => {
    dispatch(putCheck(PENDING, check.type, check))
    CheckService.disableCheck(check).
      then(() => dispatch(deleteCheck(SUCCESS, check.type, check))).
      catch(err => dispatch(deleteCheck(ERROR, check.type, err)))
  }
}

export function toggleCheck(check) {
  if (check.isEnabled) {
    return enableCheck(check)
  } else {
    return disableCheck(check)
  }
}
