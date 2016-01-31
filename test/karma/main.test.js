import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react/lib/ReactTestUtils'
import { expect } from 'chai'

import createBrowserHistory from 'history/lib/createBrowserHistory'
import { syncReduxAndRouter } from 'redux-simple-router'

import Root from '../../client/containers/root.jsx'
import Login from '../../client/components/login.jsx'
import configureStore from '../../client/store/configureStore'

// Import styles as in client/main.js.
// The CSS will be extracted by webpack.
import 'bootstrap/dist/css/bootstrap.css'
import 'font-awesome/css/font-awesome.css'
import 'bootstrap-social'
import 'bootstrap-toggle/css/bootstrap2-toggle.css'
import '../../client/css/main.css'

describe('Root', function () {

  beforeEach(() => {
    // Manually set the URL, otherwise it would be karma's "/context.html"
    // and that is not a valid route.
    history.pushState(null, '', '/')
  })

  function renderRootWithInitialState(initialState) {
    const history = createBrowserHistory()
    const store = configureStore(initialState)

    syncReduxAndRouter(history, store, (state) => state.router)

    const main = document.getElementById('main')
    const root = TestUtils.renderIntoDocument(<Root history={history} store={store}/>)

    return {root, state: store.getState(), store}
  }

  it('should render the login route when unauthenticated', () => {
    const {root, state} = renderRootWithInitialState({
      auth: {isAuthenticated: false}
    })
    expect(state).to.have.deep.property('router.path', '/login')
    const login = TestUtils.findRenderedDOMComponentWithClass(root, 'zpr-login')
    expect(TestUtils.isDOMComponent(login)).to.be.true
  })

  it('should render the home route when authenticated', done => {
    const {root, store} = renderRootWithInitialState({
      auth: {isAuthenticated: true}
    })
    expect(store.getState()).to.have.deep.property('router.path', '/')
    const home = TestUtils.findRenderedDOMComponentWithClass(root, 'zpr-home')
    expect(TestUtils.isDOMComponent(home)).to.be.true
    setTimeout(() => { // Wait for the frontend to load the mock data
      expect(store.getState()).to.have.deep.property('githubRepos.repos.length', 2)
      done()
    }, 1000)
  })
})
