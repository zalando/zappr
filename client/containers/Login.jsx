import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Row, Col } from 'react-bootstrap'

import logo from '../img/zappr.png'
import { loginGithub } from '../actions/auth'

import { logger } from '../../common/debug'
const log = logger('login')

function mapStateToProps(state) {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    isAuthenticating: state.auth.isAuthenticating
  }
}

class Login extends Component {
  static propTypes = {
    isAuthenticated: PropTypes.bool,
    isAuthenticating: PropTypes.bool
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  componentDidMount() {
    log('componentDidMount', this.props)
    if (this.props.isAuthenticated) {
      this.context.router.replace('/')
    }
  }

  render() {
    return (
      <Row className="zpr-login">
        <Col sm={6} smPush={3} md={4} mdPush={4}>
          <div className="page-header">
            <img alt="ZAPPR"
                 src={logo}
                 className="img-responsive center-block"/>
          </div>
          <a type="button"
             className="btn btn-block btn-social btn-github"
             disabled={this.props.isAuthenticating}
             href="/auth/github"
             onClick={this.props.loginGithub}>
            <span className="fa fa-github"/>
            Sign in with GitHub
          </a>
        </Col>
      </Row>
    )
  }
}

export default connect(mapStateToProps, {loginGithub})(Login)
