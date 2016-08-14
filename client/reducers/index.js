import { combineReducers } from 'redux'

import auth from './auth'
import user from './user'
import repos from './repos'
import env from './env'

export default combineReducers({
  auth,
  user,
  env,
  repos
})
