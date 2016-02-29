import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react/lib/ReactTestUtils'
import { expect } from 'chai'
import { browserHistory } from 'react-router'

import Root from '../../client/components/Root.jsx'
import Login from '../../client/containers/Login.jsx'
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
    // Create a named node to mount the React app on.
    document.body.innerHTML = '<main id="main"></main>'
    // Manually set the URL, otherwise it would be karma's "/context.html"
    // and that is not a valid route.
    browserHistory.replace('/')
  })

  afterEach(() => {
    // Unmount the React app so that it doesn't leech into the next test.
    ReactDOM.unmountComponentAtNode(document.getElementById('main'))
  })

  function renderRootWithInitialState(initialState) {
    const store = configureStore(initialState)
    const main = document.getElementById('main')
    const root = ReactDOM.render(<Root store={store}/>, document.getElementById('main'))
    //const root = TestUtils.renderIntoDocument(<Root store={store}/>)

    return {root, state: store.getState(), store}
  }

  it('should render the login route when unauthenticated', () => {
    const {root, state} = renderRootWithInitialState({
      auth: {isAuthenticated: false}
    })
    expect(window.location.pathname).to.equal('/login')
    const login = TestUtils.findRenderedDOMComponentWithClass(root, 'zpr-login')
    expect(TestUtils.isDOMComponent(login)).to.be.true
  })

  it('should render the home route when authenticated', done => {
    const {root, store} = renderRootWithInitialState({
      auth: {isAuthenticated: true}
    })
    expect(window.location.pathname).to.equal('/')
    const home = TestUtils.findRenderedDOMComponentWithClass(root, 'zpr-home')
    expect(TestUtils.isDOMComponent(home)).to.be.true
    setTimeout(() => { // Wait for the frontend to load the mock data
      expect(store.getState()).to.have.deep.property('githubRepos.repos.length', 2)
      done()
    }, 1000)
  })
})
