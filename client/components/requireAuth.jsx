import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'

/**
 * Based on https://github.com/joshgeller/react-redux-jwt-auth-example
 */
export default function requireAuth(Component, redirect = '/login') {

  function mapStateToProps(state) {
    return {
      isAuthenticated: state.auth.isAuthenticated
    }
  }

  class RequireAuthComponent extends Component {
    static propTypes = {
      isAuthenticated: PropTypes.bool.isRequired
    };
    static contextTypes = {
      router: PropTypes.object.isRequired
    };

    componentWillMount() {
      this.checkAuth(this.props)
    }

    componentWillReceiveProps(props) {
      this.checkAuth(props)
    }

    checkAuth(props) {
      if (!props.isAuthenticated) {
        this.context.router.replace(redirect)
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
