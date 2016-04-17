import { combineReducers } from 'redux'

import auth from './auth'
import user from './user'
import repos from './repos'
import checks from './checks'

export default combineReducers({
  auth,
  user,
  repos,
  checks
})
