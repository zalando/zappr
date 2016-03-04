import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { Row, Col, Image, Navbar } from 'react-bootstrap'

import { loginGithub } from '../actions/auth'
import { logger } from '../../common/debug'
import example from '../img/example.png'
import logo from '../img/zappr@2x.png'

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
    const loginButton = <a type='button'
                           className='btn btn-social btn-github'
                           disabled={this.props.isAuthenticating}
                           href='/auth/github'
                           onClick={this.props.loginGithub}>
                          <span className='fa fa-github'/>
                          Sign in with GitHub
                        </a>

    return (
      <section className='zpr-login'>
        <div style={{flex: '0 0 auto', width: '100%', background: '#ebebeb'}}>
          <div style={{textAlign: 'center', marginTop: 15}}>
            <img style={{marginLeft: -40}} src={logo} />
          </div>
          <div style={{margin: '30 0', textAlign: 'center'}}>
            {loginButton}
          </div>
        </div>
        <div style={{flex: '0 0 auto', maxWidth: '100%'}}>
          <div className='page-header'>
            <h1>Protect your <code>master</code> branch!</h1>
          </div>
          <p style={{maxWidth: 600, marginBottom: 60, fontSize: '2rem'}}>
            With ZAPPR you can block merges into any protected branch
            unless the pull request has all required approvals from colleagues.
            <img style={{marginTop: 30}} src={example} />
          </p>
        </div>
        <footer>
          Made with ♥︎ by <a href='https://zalando.com'>Zalando</a>.<br/>
          <a href='https://tech.zalando.com'>Zalando Tech</a> is <a href='https://tech.zalando.com/jobs'>hiring</a>!
        </footer>
      </section>
    )
  }
}

export default connect(mapStateToProps, {loginGithub})(Login)
