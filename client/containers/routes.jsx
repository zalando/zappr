import React from 'react'
import { IndexRoute, Route } from 'react-router'

import App from './app.jsx'
import requireAuth from './requireAuth.jsx'
import Home from '../components/home.jsx'
import Login from '../components/login.jsx'
import Settings from '../components/settings.jsx'

export default (
  <Route path="/" component={App}>
    <IndexRoute component={requireAuth(Home)}/>
    <Route path="login" component={Login}/>
    <Route path="settings" component={requireAuth(Settings)}/>
  </Route>
)
