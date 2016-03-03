import CheckService from '../service/CheckService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const PUT_CHECK = Symbol('put check')
export const DELETE_CHECK = Symbol('delete check')

const putCheck = (status, payload = null) => ({
  type: PUT_CHECK,
  status,
  payload
})

const deleteCheck = (status, payload = null) => ({
  type: DELETE_CHECK,
  status,
  payload
})

function enableCheck(check) {
  return (dispatch) => {
    dispatch(putCheck(PENDING, check))
    CheckService.enableCheck(check).
      then(() => dispatch(putCheck(SUCCESS, check))).
      catch(err => dispatch(putCheck(ERROR, err)))
  }
}

function disableCheck(check) {
  console.log('disableCheck', check)
  return (dispatch) => {
    dispatch(putCheck(PENDING, check))
    CheckService.disableCheck(check).
      then(() => dispatch(deleteCheck(SUCCESS, check))).
      catch(err => dispatch(deleteCheck(ERROR, err)))
  }
}

export function toggleCheck(check) {
  if (check.isEnabled) {
    return enableCheck(check)
  } else {
    return disableCheck(check)
  }
}
