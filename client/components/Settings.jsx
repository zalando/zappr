import React from 'react'

import NavHeaderComponent from './NavHeaderComponent.jsx'

export default class Nav extends NavHeaderComponent {
  renderMe() {
    return (
      <p>Hello, settings</p>
    )
  }
}
