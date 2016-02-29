import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

import { fetchReposIfNeeded } from '../actions/api'
import { setEnabled as setRepoEnabled } from '../actions/repo'
import { logger } from '../../common/debug'

const log = logger('app')

function mapStateToProps(state) {
  return {
    user: state.user,
    githubRepos: state.githubRepos,
    isAuthenticated: state.auth.isAuthenticated
  }
}

class App extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };

  componentDidMount() {
    log('app did mount', this.props)
    if (this.props.isAuthenticated) {
      this.props.fetchReposIfNeeded()
    }
  }

  onRepoToggle(id, isActive) {
    log('onRepoToggle', isActive)
    this.props.setRepoEnabled(id, isActive)
  }

  render() {
    const childrenProps = {
      user: this.props.user,
      githubRepos: this.props.githubRepos,
      onRepoToggle: this.onRepoToggle.bind(this)
    }
    return (React.cloneElement(this.props.children, childrenProps))
  }
}

export default connect(mapStateToProps, {fetchReposIfNeeded, setRepoEnabled})(App)
