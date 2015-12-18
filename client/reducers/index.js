import { combineReducers } from 'redux'
import { routeReducer } from 'redux-simple-router'
import auth from './auth'
import user from './user'
import { githubRepos } from './api'

export default combineReducers({
  router: routeReducer,
  auth,
  user,
  githubRepos
})
