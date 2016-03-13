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
  checks[action.payload.type] = checks[action.payload.type] || {}
  if (action.status === PENDING) {
    checks[action.payload.type].isUpdating = true
    checks[action.payload.type].error = false
  } else if (action.status === SUCCESS) {
    checks[action.payload.type].isUpdating = false
    checks[action.payload.type].error = false
    checks[action.payload.type].enabled = action.type === PUT_CHECK
  } else if (action.status === ERROR) {
    checks[action.payload.type].isUpdating = false
    checks[action.payload.type].error = action.payload
  }
  return checks
}
