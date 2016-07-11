import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Image } from 'react-bootstrap'
import logo from '../img/logo.svg'

export default class NavHeader extends Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    user: PropTypes.object.isRequired
  };

  isActive(path) {
    if (this.props.path === path) {
      return 'active'
    } else {
      return null
    }
  }

  render() {
    const { displayName, username, html_url, avatar_url } = this.props.user

    const style = {
      logo: {
        marginTop: '-1px',
        display: 'inline',
        height: '65px'
      },
      logoText: {
        fontWeight: 700,
        fontSize: '2rem',
        marginTop: '13px',
        marginBottom: 0,
        color: '#555'
      },
      avatar: {
        width: '40px',
        marginTop: '13px'
      }
    }
    return (
      <Navbar fluid={true}>
        <Navbar.Header>
          <Navbar.Brand>
            <Link to="/"
                  style={{padding: '0 15px'}}>
              <Image alt="Zappr"
                     src={`/${logo}`}
                     style={style.logo}/>
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Navbar.Text style={style.logoText}>
            Zappr
          </Navbar.Text>
          <Nav>
            <li className={this.isActive('/')}>
              <Link to="/">Home</Link>
            </li>
            {/*<li className={this.isActive('/settings')}>
              <Link to="/settings">Settings</Link>
            </li>*/}
          </Nav>
          <Nav pullRight>
            <NavDropdown title={displayName || username} id="basic-nav-dropdown">
              <MenuItem href={html_url}>
                Profile
              </MenuItem>
              <MenuItem divider/>
              <MenuItem href="/logout">
                <i className="fa fa-sign-out"/>&nbsp;sign out
              </MenuItem>
            </NavDropdown>
            <li>
              <Image alt="avatar"
                     className="hidden-xs"
                     style={style.avatar}
                     src={avatar_url}
                     circle/>
            </li>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}
