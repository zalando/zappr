import thunk from 'redux-thunk'
import { createStore, applyMiddleware, compose } from 'redux'

import combinedReducers from '../reducers'

export default function configureStore(initialState) {
  return compose(applyMiddleware(
    thunk
  ))(createStore)(combinedReducers, initialState)
}
