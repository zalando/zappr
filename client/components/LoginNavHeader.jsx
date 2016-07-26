import React, { Component, PropTypes } from 'react'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Image } from 'react-bootstrap'
import icon from '../img/icon.svg'

function LoginNavHeader() {
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
        <NavItem href="#gettingstarted">
          Getting started
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
      </Nav>
    </Navbar.Collapse>
  </Navbar>
}
export default LoginNavHeader
