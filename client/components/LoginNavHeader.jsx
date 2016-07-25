import React, { Component, PropTypes } from 'react'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Image } from 'react-bootstrap'
import { loginGithub } from '../actions/auth'
import { connect } from 'react-redux'
import icon from '../img/icon.svg'

function mapStateToProps(state) {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    isAuthenticating: state.auth.isAuthenticating
  }
}

class LoginNavHeader extends Component {

  static propTypes = {
    isAuthenticated: PropTypes.bool,
    isAuthenticating: PropTypes.bool
  };

  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  componentDidMount() {
    if (this.props.isAuthenticated) {
      this.context.router.replace('/')
    }
  }

  render() {
    return <Navbar className="zpr-login-navbar">
      <Navbar.Header>
        <Navbar.Brand>
          <img src={icon}/>
        </Navbar.Brand>
        <Navbar.Text>
          Zappr
        </Navbar.Text>
      </Navbar.Header>
      <Nav>
        <NavItem href="#features">
          Features
        </NavItem>
        <NavItem href="#benefits">
          Benefits
        </NavItem>
      </Nav>
      <Nav pullRight>
        <NavItem href='/auth/github'>
          <button type='button'
                  className='btn btn-social btn-github btn-sm'
                  disabled={this.props.isAuthenticating}
                  onClick={this.props.loginGithub}>
            <span className='fa fa-github'/>
            Sign in with GitHub
          </button>
        </NavItem>
      </Nav>
    </Navbar>
  }
}

export default connect(mapStateToProps, {loginGithub})(LoginNavHeader)
