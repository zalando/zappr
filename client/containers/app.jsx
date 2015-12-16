import React from 'react'
import { Link } from 'react-router'
import { connect } from 'react-redux'

import authActions from '../actions/auth'
import Optional from '../components/optional.jsx'
import ZapprNav from '../components/navbar.jsx'
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

  componentDidMount() {
    log('componentDidMount', this.props)
  }

  render() {
    const { displayName,url } = this.props.user
    const avatar = this.props.user.photos[0]

    return (
      <div>
        <Optional if={this.props.path.search(/^\/login/) === -1}>
          <ZapprNav path={this.props.path}
                    user={{displayName, avatar, url}}/>
        </Optional>
        <div className="container">
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, authActions)(App)
