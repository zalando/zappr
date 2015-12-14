import React from 'react'

import {createStore, compose, combineReducers} from 'redux'
import {ReduxRouter, routerStateReducer, reduxReactRouter} from 'redux-router'

import {Route} from 'react-router'
import {Provider} from 'react-redux'
import {createHistory} from 'history'

// Import CSS. Will be extracted by webpack.
import bootstrap from 'bootstrap/dist/css/bootstrap.css'

import App from './app.jsx'
import Login from './login.jsx'

const reducer = combineReducers({
  router: routerStateReducer
})

const store = compose(
  reduxReactRouter({createHistory})
)(createStore)(reducer)

export default class Main extends React.Component {
  render() {
    return (
        <Provider store={store}>
          <ReduxRouter>
            <Route path="/" component={App}>
              <Route path="login" component={Login}/>
            </Route>
          </ReduxRouter>
        </Provider>
    )
  }
}
