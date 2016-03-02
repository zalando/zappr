import { combineReducers } from 'redux'

import auth from './auth'
import user from './user'
import repos from './repos'

export default combineReducers({
  auth,
  user,
  repos
})
