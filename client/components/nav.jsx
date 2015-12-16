import React from 'react'
import { Link } from 'react-router'

export default class Nav extends React.Component {
  static propTypes = {
    user: React.PropTypes.object.isRequired,
    logout: React.PropTypes.func.isRequired
  }

  isActive(path) {
    if (this.props.path === path) {
      return 'active'
    } else {
      return null
    }
  }

  render() {
    return (
      <nav className="navbar navbar-default navbar-static-top">
        <div className="container">
          <div className="container-fluid">
            <div className="navbar-header">
              <button type="button"
                      className="navbar-toggle collapsed"
                      dataToggle="collapse"
                      dataTarget="#navbar">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
              <Link to="/" className="navbar-brand"
                    style={{padding: '0 15px'}}>
                <img alt="ZAPPR"
                     style={{paddingTop: '1px'}}
                     src={require('../img/icon.png')}
                     className="img-responsive"/>
              </Link>
            </div>
            <div id="navbar" className="navbar-collapse collapse">
              <ul className="nav navbar-nav">
                <li className={this.isActive('/')}>
                  <Link to="/">Home</Link>
                </li>
                <li cclassName={this.isActive('/settings')}>
                  <Link to="/settings">Settings</Link>
                </li>
              </ul>
              <ul className="nav navbar-nav navbar-right">
                <li className="dropdown">
                  <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button">
                    {this.props.user.displayName}&nbsp;<span className="caret"/>
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <a onClick={this.props.logout}>
                        <i className="fa fa-sign-out"/>&nbsp;sign out
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    )
  }
}

//<button type="button"
//        className="btn btn-default btn-sm navbar-btn navbar-right"
//        onClick={this.props.logout}>
//  <i className="fa fa-sign-out"/>&nbsp;sign out
//</button>
