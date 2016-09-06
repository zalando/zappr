import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import Optional from '../components/Optional.jsx'
import AppNavHeader from '../components/NavHeader.jsx'
import LoginNavHeader from '../components/LoginNavHeader.jsx'
import CookieBanner from '../components/CookieBanner.jsx'
import { requestReposIfNeeded } from '../actions/repos'
import { logger } from '../../common/debug'

const log = logger('app')

function mapStateToProps(state) {
  return {
    user: state.user,
    usingExtendedAccess: state.env.USING_EXTENDED_ACCESS,
    isAuthenticated: state.auth.isAuthenticated
  }
}

class App extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    requestReposIfNeeded: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
  };

  componentDidMount() {
    log('componentDidMount', this.props)
    if (this.props.isAuthenticated) {
      this.props.requestReposIfNeeded()
    }
  }

  render() {
    const showLogin = this.props.location.pathname.search(/^\/login/) !== -1
    return (
      <div className='zpr-app'>
        <CookieBanner/>
        <Optional if={!showLogin}>
          <AppNavHeader path={this.props.location.pathname}
                        user={this.props.user}
                        usingExtendedAccess={this.props.usingExtendedAccess}/>
        </Optional>
        <Optional if={showLogin}>
          <LoginNavHeader />
        </Optional>
        <div className={showLogin ? '' : 'container-fluid'}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, {requestReposIfNeeded})(App)
