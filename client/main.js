import React from 'react'
import ReactDOM from 'react-dom'

import createBrowserHistory from 'history/lib/createBrowserHistory'
import { syncReduxAndRouter } from 'redux-simple-router'

import { bind as bindLogger } from '../common/debug'
import configureStore from './store/configureStore'
import Root from './containers/root.jsx'

// Import CSS. Will be extracted by webpack.
import 'bootstrap/dist/css/bootstrap.css'
import 'font-awesome/css/font-awesome.css'
import 'bootstrap-social'
import 'bootstrap-toggle/css/bootstrap2-toggle.css'
import './css/main.css'
import 'file?name=[name].[ext]!./img/favicon.ico'

// Get the initial state from a global injected by the server
const initialState = window.__INITIAL_STATE__

const history = createBrowserHistory()
const store = configureStore(initialState)
bindLogger(window)

syncReduxAndRouter(history, store, (state) => state.router)

ReactDOM.render(<Root history={history} store={store}/>, document.getElementById('main'))
