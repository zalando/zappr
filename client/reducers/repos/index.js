import { combineReducers } from 'redux'

import items from './items'
import checks from './checks'
import status from './status'
import validations from './validate'

export default combineReducers({
  items,
  checks,
  status,
  validations
})
