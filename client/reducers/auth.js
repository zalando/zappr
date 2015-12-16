import {
  LOGIN_GITHUB_REQUEST,
  LOGIN_GITHUB_SUCCESS,
  LOGIN_GITHUB_FAILURE,
  LOGOUT_GITHUB
} from '../actions/auth'

import { logger } from '../../common/debug'
const log = logger('auth')

const initialState = {
  isAuthenticating: false
}

export default function auth(state = initialState, action) {
  log('reduce', action.type)

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
    case LOGOUT_GITHUB:
      return Object.assign({}, state, {
        isAuthenticated: false
      })
    default:
      return state
  }
}
