import React from 'react'
import { connect } from 'react-redux'
import { Row, Col } from 'react-bootstrap'

import logo from '../img/zappr.png'
import { loginGithub, confirmLoginGithub } from '../actions/auth'

import { logger } from '../../common/debug'
const log = logger('login')

function mapStateToProps(state) {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    isAuthenticating: state.auth.isAuthenticating
  }
}

class Login extends React.Component {
  static propTypes = {
    isAuthenticating: React.PropTypes.bool
  };

  componentDidMount() {
    log('componentDidMount', this.props)
    if (this.props.isAuthenticated) {
      this.props.confirmLoginGithub()
    }
  }

  render() {
    return (
      <Row>
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

export default connect(mapStateToProps, {loginGithub, confirmLoginGithub})(Login)
