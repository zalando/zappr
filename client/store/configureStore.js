import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import api from '../middleware/api'
import combinedReducers from '../reducers'

export default function configureStore(initialState) {
  return compose(applyMiddleware(thunk, api))(createStore)(combinedReducers, initialState)
}
