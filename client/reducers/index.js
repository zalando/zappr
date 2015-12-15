import { combineReducers } from 'redux'
import { routeReducer } from 'redux-simple-router'
import auth from './auth'

export default combineReducers({
  router: routeReducer,
  auth
})
