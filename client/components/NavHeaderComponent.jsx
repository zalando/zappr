import React, { Component, PropTypes } from 'react'

import NavHeader from './NavHeader.jsx'

export default class NavHeaderComponent extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
  };

  render() {
    const {location, user} = this.props
    return (
      <div>
        <NavHeader path={location.pathname} user={user}/>
        <div className="container">
          {this.renderMe()}
        </div>
      </div>
    )
  }

  /**
   * Abstract render function for child components.
   */
  renderMe() {
    throw new Error('inheriting components must implement renderMe')
  }
}
