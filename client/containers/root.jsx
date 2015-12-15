import React from 'react'

import { createStore, compose, combineReducers } from 'redux'
import { Provider } from 'react-redux'

import { Router, IndexRoute, Route } from 'react-router'
import { syncReduxAndRouter, routeReducer } from 'redux-simple-router'

import App from './app.jsx'
import requireAuth from './requireAuth.jsx'
import Home from '../components/home.jsx'
import Login from '../components/login.jsx'
import Settings from '../components/settings.jsx'

export default class Root extends React.Component {
  static propTypes = {
    history: React.PropTypes.object.isRequired,
    store: React.PropTypes.object.isRequired
  }

  render() {
    return (
      <Provider store={this.props.store}>
        <Router history={this.props.history}>
          <Route path="/" component={App}>
            <IndexRoute component={requireAuth(Home)}/>
            <Route path="login" component={Login}/>
            <Route path="settings" component={Settings}/>
          </Route>
        </Router>
      </Provider>
    )
  }
}
