import { PUT_CHECK, DELETE_CHECK } from '../actions/checks'

export default function checks(state = [], action) {
  switch (action.type) {
    case PUT_CHECK:
      return state.concat(action.payload)
    case DELETE_CHECK:
      break
    default:
      return state.filter(check => check.type !== action.payload.type)
  }
}
