import 'babel-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react/lib/ReactTestUtils'
import { expect } from 'chai'
import { browserHistory } from 'react-router'

import Root from '../../client/components/Root.jsx'
import RepositoryList from '../../client/components/RepositoryList.jsx'
import RepositoryDetail from '../../client/containers/RepositoryDetail.jsx'
import CookieBanner from '../../client/components/CookieBanner.jsx'
import configureStore from '../../client/store/configureStore'
import { waitFor } from '../utils'
import { getIn } from '../../common/util'

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

    return {root, state: store.getState(), store}
  }

  async function waitForStoreUpdate(store, checkFn, done) {
    try {
      await waitFor(() => checkFn(store), 1000)
    } catch (e) {
      return done('mock data did not load for 1 second')
    }
  }

  it('should render the login route when unauthenticated', () => {
    const {root} = renderRootWithInitialState({
      auth: {isAuthenticated: false}
    })
    expect(window.location.pathname).to.equal('/login')
    const login = TestUtils.findRenderedDOMComponentWithClass(root, 'zpr-login')
    expect(TestUtils.isDOMComponent(login)).to.be.true
  })

  it('should render the cookie banner if the cookie is not set', () => {
    CookieBanner.deleteCookie()

    const {root} = renderRootWithInitialState({
      auth: {isAuthenticated: false}
    })
    const cookieBanner = TestUtils.findRenderedComponentWithType(root, CookieBanner)
    expect(TestUtils.isCompositeComponent(cookieBanner)).to.be.true
  })

  it.skip('should not render the cookie banner if the cookie is set', () => {
    CookieBanner.setCookie() // Cookie is set in Karma but CookieBanner is still present??

    const {root} = renderRootWithInitialState({
      auth: {isAuthenticated: false}
    })
    const cookieBanner = TestUtils.findRenderedComponentWithType(root, CookieBanner)
    console.log(cookieBanner)
    expect(TestUtils.isCompositeComponent(cookieBanner)).to.be.false
  })

  it('should render the home route when authenticated', async(done) => {
    try {
      const {root, store} = renderRootWithInitialState({
        auth: {isAuthenticated: true}
      })
      expect(window.location.pathname).to.equal('/')
      const home = TestUtils.findRenderedDOMComponentWithClass(root, 'zpr-home')
      expect(TestUtils.isDOMComponent(home)).to.be.true
      await waitForStoreUpdate(store, store => Object.keys(getIn(store.getState(), ['repos', 'items'], {})).length > 0, done)
      expect(store.getState())
      .to.have.deep.property('repos.items')
      .and.to.have.all.keys(['mfellner/angular-react', 'mfellner/atomic-directive-demo'])
      done()
    } catch (e) {
      done(e)
    }
  })

  it('should render the repository list', async(done) => {
    try {
      const {root, store} = renderRootWithInitialState({
        auth: {isAuthenticated: true}
      })
      const repositoryList = TestUtils.findRenderedComponentWithType(root, RepositoryList)
      expect(TestUtils.isCompositeComponent(repositoryList)).to.be.true
      await waitForStoreUpdate(store, store => Object.keys(getIn(store.getState(), ['repos', 'items'], {})).length > 0, done)
      expect(repositoryList.props)
      .to.have.deep.property('repositories.mfellner/angular-react.name', 'angular-react')
      expect(repositoryList.props)
      .to.have.deep.property('repositories.mfellner/atomic-directive-demo.name', 'atomic-directive-demo')
      done()
    } catch (e) {
      done(e)
    }
  })

  it('should enable a check', async function (done) {
    try {
      const {root, store} = renderRootWithInitialState({
        auth: {isAuthenticated: true}
      })
      await waitForStoreUpdate(store, store => Object.keys(getIn(store.getState(), ['repos', 'items'], {})).length > 0, done)
      const items = TestUtils.scryRenderedDOMComponentsWithClass(root, 'zpr-repository-list-item')
      TestUtils.Simulate.click(items[0], {button: 0})

      function findToggle(type) {
        return TestUtils.findAllInRenderedTree(root, function (element) {
          try {
            return element.props.check.type === type
          } catch (e) {
            return false
          }
        })[0]
      }

      let repoCheck = findToggle('approval')
      const toggle = TestUtils.findRenderedDOMComponentWithClass(repoCheck, 'toggle')
      TestUtils.Simulate.click(toggle, {button: 0})
      expect(repoCheck.props.check.isUpdating).to.be.true
      await waitForStoreUpdate(store, store => getIn(store.getState(), ['repos', 'items', 'mfellner/angular-react', 'checks'], []).length > 0, done)
      expect(repoCheck.props.check.isEnabled).to.be.true
      done()
    } catch (e) {
      console.log(e.stack)
      done(e)
    }
  })

  it('should render the selected repository', async(done) => {
    try {
      const {root, store} = renderRootWithInitialState({
        auth: {isAuthenticated: true}
      })

      await waitForStoreUpdate(store, store => Object.keys(getIn(store.getState(), ['repos', 'items'], {})).length > 0, done)

      function clickOnDetail(i) {
        const items = TestUtils.scryRenderedDOMComponentsWithClass(root, 'zpr-repository-list-item')
        TestUtils.Simulate.click(items[i], {button: 0})
        return TestUtils.findRenderedComponentWithType(root, RepositoryDetail)
      }

      for (let i = 0, detail; i < 2; i += 1) {
        detail = clickOnDetail(i)
        expect(TestUtils.isCompositeComponent(detail)).to.be.true
        expect(window.location.pathname).to.equal('/repository/' + detail.props.repository.full_name)
      }
      done()
    } catch (e) {
      done(e)
    }
  })
})
