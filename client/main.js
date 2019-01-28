import React from 'react'
import ReactDOM from 'react-dom'

import { bind as bindLogger } from '../common/debug'
import configureStore from './store/configureStore'
import Root from './components/Root.jsx'

// The CSS will be extracted by webpack.
import './css/bootstrap-paper.css'
import 'font-awesome/css/font-awesome.css'
import 'bootstrap-social'
import 'bootstrap-toggle/css/bootstrap2-toggle.css'
import './css/main.css'
import './css/frontpage.css'
// Webpack copies the favicon file to the output directory.
import 'file-loader?name=[name].[ext]!./img/favicon.ico'

// Get the initial state from a global injected by the server
const initialState = window.__INITIAL_STATE__
const store = configureStore(initialState)
bindLogger(window)

ReactDOM.render(<Root store={store}/>, document.getElementById('main'))
