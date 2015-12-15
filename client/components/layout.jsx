import React from 'react'

export class Container extends React.Component {
  render() {
    return (
      <div className="container">
        {this.props.children}
      </div>
    )
  }
}

export class Row extends React.Component {
  render() {
    return (
      <div className="row">
        {this.props.children}
      </div>
    )
  }
}

/**
 * Properties:
 *
 * gridClasses: xs, sm, md, lg-[1..12]
 */
export class Col extends React.Component {
  static propTypes = {
    xs: React.PropTypes.number,
    sm: React.PropTypes.number,
    md: React.PropTypes.number,
    lg: React.PropTypes.number
  }

  render() {
    const className = Object.keys(this.props).
      map(k => {
        switch (k) {
          case 'xs':
          case 'sm':
          case 'md':
          case 'lg':
            return `col-${k}-${this.props[k]}`
          default:
            return ''
        }
      }).
      reduce((a, b) => (
        `${a} ${b}`
      ))
      + (this.props.className || '')

    return (
      <div className={className}>
        {this.props.children}
      </div>
    )
  }
}
