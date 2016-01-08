import React from 'react'

export default class Optional extends React.Component {
  static propTypes = {
    if: React.PropTypes.bool.isRequired,
    children: React.PropTypes.node.isRequired
  };

  render() {
    if (this.props.if) {
      return this.props.children
    } else {
      return null
    }
  }
}
