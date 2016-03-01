import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import Optional from '../components/Optional.jsx'
import NavHeader from '../components/NavHeader.jsx'
import { fetchReposIfNeeded } from '../actions/api'
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
    fetchReposIfNeeded: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
  };

  componentDidMount() {
    log('componentDidMount', this.props)
    if (this.props.isAuthenticated) {
      this.props.fetchReposIfNeeded()
    }
  }

  render() {
    return (
      <div className="zpr-app">
        <Optional if={this.props.location.pathname.search(/^\/login/) === -1}>
          <NavHeader path={this.props.location.pathname}
                     user={this.props.user}/>
        </Optional>
        <div className="container">
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, {fetchReposIfNeeded})(App)
