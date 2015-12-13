import React from 'react'

/**
 * Properties:
 *
 * gridClasses: xs, sm, md, lg-[1..12]
 */
export default class Col extends React.Component {
  render() {

    const className = this.props.gridClasses.
    reduce((s, c) => `${s} col-${c}`, '').
    trim()

    return (
      <div className={className}>
        <div className="box">
          {this.props.children}
        </div>
      </div>
    )
  }
}

Col.propTypes = {
  gridClasses: React.PropTypes.array.isRequired
}
