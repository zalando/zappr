import React, { Component, PropTypes } from 'react'

export default class Spinner extends Component {
  static propTypes = {
    size: PropTypes.number.isRequired
  };

  static defaultProps = {
    size: 1
  };

  render() {
    const style = {
      padding: '100px',
      color: '#663931'
    }
    return (
      <div className="text-center" style={style}>
        <i className={`fa fa-circle-o-notch fa-spin fa-${this.props.size}x`}/>
      </div>
    )
  }
}
