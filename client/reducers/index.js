import { combineReducers } from 'redux'

import auth from './auth'
import user from './user'
import { githubRepos } from './api'

export default combineReducers({
  auth,
  user,
  githubRepos
})
