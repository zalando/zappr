import React from 'react'
import { connect } from 'react-redux'

import authActions from '../actions/auth'
import { Row, Col } from './layout.jsx'

import { logger } from '../../common/debug'
const log = logger('login')

function mapStateToProps(state) {
  return {
    isAuthenticating: state.auth.isAuthenticating
  }
}

class Login extends React.Component {
  static propTypes = {
    isAuthenticating: React.PropTypes.bool
  }

  login(event) {
    event.preventDefault()
    this.props.loginGithub()
  }

  componentDidMount() {
    log('componentDidMount', this.props)
  }

  componentWillUpdate(props) {
    log('componentWillUpdate', props)
  }

  render() {
    return (
      <Row>
        <Col md={4} className="col-md-push-4">
          <h2 className="text-center">ZAPPR</h2>
          <button type="button"
                  className="btn btn-block btn-social btn-github"
                  disabled={this.props.isAuthenticating}
                  onClick={this.login.bind(this)}>
            <span className="fa fa-github"/>
            Sign in with GitHub
          </button>
        </Col>
      </Row>
    )
  }
}

export default connect(mapStateToProps, authActions)(Login)
