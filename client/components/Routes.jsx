import React from 'react'
import { IndexRoute, Route } from 'react-router'

import App from '../containers/App.jsx'
import Home from '../components/home.jsx'
import Login from '../containers/Login.jsx'
import Settings from '../components/settings.jsx'
import requireAuth from './requireAuth.jsx'

export default (
  <Route path="/" component={App}>
    <IndexRoute component={requireAuth(Home)}/>
    <Route path="login" component={Login}/>
    <Route path="settings" component={requireAuth(Settings)}/>
  </Route>
)
