import React from 'react'
import { Link } from 'react-router'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem, Image } from 'react-bootstrap'

export default class ZapprNav extends React.Component {
  static propTypes = {
    user: React.PropTypes.object.isRequired
  }

  isActive(path) {
    if (this.props.path === path) {
      return 'active'
    } else {
      return null
    }
  }

  render() {
    const style = {
      logo: {
        marginTop: '1px',
        display: 'inline'
      },
      logoText: {
        fontFamily: 'minecraftmedium',
        fontSize: '2rem',
        marginBottom: 0,
        color: '#663931'
      },
      avatar: {
        width: '40px',
        marginTop: '5px'
      }
    }
    return (
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            <Link to="/"
                  style={{padding: '0 15px'}}>
              <Image alt="ZAPPR"
                     src={require('../img/icon.png')}
                     style={style.logo}/>
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Navbar.Text style={style.logoText}>
            ZAPPR
          </Navbar.Text>
          <Nav>
            <li className={this.isActive('/')}>
              <Link to="/">Home</Link>
            </li>
            <li className={this.isActive('/settings')}>
              <Link to="/settings">Settings</Link>
            </li>
          </Nav>
          <Nav pullRight>
            <NavDropdown title={this.props.user.displayName} id="basic-nav-dropdown">
              <MenuItem href={this.props.user.url}>
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
                     src={this.props.user.avatar}
                     circle/>
            </li>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}
