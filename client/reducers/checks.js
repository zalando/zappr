import { PUT_CHECK, DELETE_CHECK } from '../actions/checks'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export function init(repo) {
  return repo.checks.map(c => ({
    type: c.type,
    error: false,
    isUpdating: false,
    enabled: true
  }))
  .reduce((state, check) => {
    state[check.type] = check;
    return state
  }, {})
}

export default function checks(state = {}, action) {
  const checks = Object.assign({}, state)
  const checkType = action.check
  checks[checkType] = checks[checkType] || {}
  if (action.status === PENDING) {
    checks[checkType].isUpdating = true
    checks[checkType].error = false
  } else if (action.status === SUCCESS) {
    checks[checkType].isUpdating = false
    checks[checkType].error = false
    checks[checkType].enabled = action.type === PUT_CHECK
  } else if (action.status === ERROR) {
    checks[checkType].isUpdating = false
    checks[checkType].error = action.payload
  }
  console.debug(state, checkType, action, checks);
  return checks
}
