import { combineReducers } from 'redux'
import { routeReducer } from 'redux-simple-router'
import auth from './auth'
import user from './user'

export default combineReducers({
  router: routeReducer,
  auth,
  user
})
