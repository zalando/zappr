import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import Optional from '../components/Optional.jsx'
import NavHeader from '../components/NavHeader.jsx'
import { requestReposIfNeeded } from '../actions/repos'
import { logger } from '../../common/debug'

const log = logger('app')

function mapStateToProps(state) {
  return {
    user: state.user,
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
    return (
      <div className="zpr-app">
        <Optional if={this.props.location.pathname.search(/^\/login/) === -1}>
          <NavHeader path={this.props.location.pathname}
                     user={this.props.user}/>
        </Optional>
        <div className="container-fluid">
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, {requestReposIfNeeded})(App)
