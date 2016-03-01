import React, { Component, PropTypes } from 'react'

export default class Optional extends Component {
  static propTypes = {
    if: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired
  };

  render() {
    if (this.props.if) {
      return this.props.children
    } else {
      return null
    }
  }
}
