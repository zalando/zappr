import { combineReducers } from 'redux'

import items from './items'
import checks from './checks'
import status from './status'

export default combineReducers({
  items,
  checks,
  status
})
