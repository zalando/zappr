import React from 'react'
import { Input } from 'react-bootstrap'

import Optional from './optional.jsx'

/**
 * Based on http://www.bootstraptoggle.com
 */
export default class Toggle extends React.Component {
  static propTypes = {
    checked: React.PropTypes.bool.isRequired,
    onToggle: React.PropTypes.func.isRequired,
    isUpdating: React.PropTypes.bool.isRequired,
    className: React.PropTypes.string
  }

  static defaultProps = {
    checked: false,
    isUpdating: false
  }

  onToggle(event) {
    event.preventDefault()
    if (!this.props.isUpdating) {
      this.props.onToggle(!this.props.checked)
    }
  }

  render() {
    const { checked, isUpdating, className } = this.props
    const off = checked ? 'primary' : 'default off'
    const disabled = isUpdating ? ' disabled' : ''

    const spinner = isUpdating
      ? (<span><i className="fa fa-refresh fa-spin"/>&nbsp;</span>)
      : null

    return (
      <div className={`${className} toggle btn btn-${off} ${disabled}`}
           style={{width:'58px',height:'34px'}}
           onClick={this.onToggle.bind(this)}>
        <Input type="checkbox" checked={checked} disabled={!!disabled}/>
        <div className="toggle-group">
          <label className="btn btn-primary toggle-on">{spinner || 'On'}</label>
          <label className="btn btn-default active toggle-off">{spinner || 'Off'}</label>
          <span className="toggle-handle btn btn-default"/>
        </div>
      </div>
    )
  }
}
