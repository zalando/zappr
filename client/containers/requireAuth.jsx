import React from 'react'
import { connect } from 'react-redux'
import { pushPath } from 'redux-simple-router'

/**
 * Based on https://github.com/joshgeller/react-redux-jwt-auth-example
 */
export default function requireAuth(Component) {

  function mapStateToProps(state) {
    return {
      isAuthenticated: state.auth.isAuthenticated
    }
  }

  class RequireAuthComponent extends React.Component {
    static propTypes = {
      isAuthenticated: React.PropTypes.bool.isRequired
    }

    componentWillMount() {
      this.checkAuth()
    }

    componentWillReceiveProps() {
      this.checkAuth()
    }

    checkAuth() {
      if (!this.props.isAuthenticated) {
        this.props.dispatch(pushPath('/login'))
      }
    }

    render() {
      if (this.props.isAuthenticated) {
        return (<Component {...this.props}/>)
      } else {
        return null
      }
    }
  }

  return connect(mapStateToProps)(RequireAuthComponent)
}
