import {
  LOGIN_GITHUB_REQUEST,
  LOGIN_GITHUB_SUCCESS,
  LOGIN_GITHUB_FAILURE,
  LOGOUT_GITHUB_REQUEST
} from '../actions/auth'

export default function auth(state = {isAuthenticating: false}, action) {
  switch (action.type) {
    case LOGIN_GITHUB_REQUEST:
      return Object.assign({}, state, {
        isAuthenticating: true
      })
    case LOGIN_GITHUB_SUCCESS:
      return Object.assign({}, state, {
        isAuthenticating: false,
        isAuthenticated: true
      })
    case LOGIN_GITHUB_FAILURE:
      return Object.assign({}, state, {
        isAuthenticating: false,
        isAuthenticated: false
      })
    case LOGOUT_GITHUB_REQUEST:
      return Object.assign({}, state, {
        isAuthenticating: false,
        isAuthenticated: false
      })
    default:
      return state
  }
}
