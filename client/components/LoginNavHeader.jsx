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
      <Navbar.Collapse>
        <Nav>
          <NavItem href="#features">
            Features
          </NavItem>
          <NavItem href="#benefits">
            Benefits
          </NavItem>
        </Nav>
        <Nav pullRight className="github-buttons">
          <a className="github-button"
             href="https://github.com/zalando/zappr"
             data-icon="octicon-star"
             data-style="mega"
             data-count-href="/zalando/zappr/stargazers"
             data-count-api="/repos/zalando/zappr#stargazers_count"
             data-count-aria-label="# stargazers on GitHub"
             aria-label="Star zalando/zappr on GitHub">Star</a>
          <a className="github-button"
             href="https://github.com/zalando/zappr/archive/master.zip"
             data-icon="octicon-cloud-download"
             data-style="mega"
             aria-label="Download zalando/zappr on GitHub">Download</a>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  }
}

export default connect(mapStateToProps, {loginGithub})(LoginNavHeader)
