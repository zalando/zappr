import React from 'react'
import { Link } from 'react-router'
import { connect } from 'react-redux'

import authActions from '../actions/auth'
import Optional from '../components/optional.jsx'
import Nav from '../components/nav.jsx'
import { logger } from '../../common/debug'
const log = logger('app')

function mapStateToProps(state) {
  return {
    path: state.router.path,
    isAuthenticated: state.auth.isAuthenticated,
    user: state.user
  }
}

class App extends React.Component {
  static propTypes = {
    path: React.PropTypes.string.isRequired,
    children: React.PropTypes.node.isRequired
  }

  logout(event) {
    event.preventDefault()
    this.props.logoutGithub()
  }

  componentDidMount() {
    log('componentDidMount', this.props)
  }

  render() {
    const {displayName, photos} = this.props.user

    return (
      <div>
        <Optional if={this.props.path !== '/login'}>
          <Nav path={this.props.path}
               user={{displayName, photos}}
               logout={this.logout.bind(this)}/>
        </Optional>
        <div className="container">
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, authActions)(App)
