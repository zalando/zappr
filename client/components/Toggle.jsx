import React, { Component, PropTypes } from 'react'
import { FormGroup, Checkbox } from 'react-bootstrap'

/**
 * Based on http://www.bootstraptoggle.com
 */
export default class Toggle extends Component {
  static propTypes = {
    checked: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    isUpdating: PropTypes.bool.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    checked: false,
    isUpdating: false,
    className: ''
  };

  onToggle(event) {
    event.preventDefault()
    if (!this.props.isUpdating) {
      this.props.onToggle(!this.props.checked)
    }
  }

  render() {
    const { checked, isUpdating, className } = this.props
    const off = checked ? 'primary' : 'default off'
    const disabled = isUpdating ? 'disabled' : ''
    const spinner = isUpdating
      ? (<span><i className="fa fa-refresh fa-spin"/>&nbsp;</span>)
      : null

    return (
      <div className={`${className} toggle btn btn-${off} ${disabled}`.trim()}
           style={{width:'58px',height:'34px'}}
           onClick={this.onToggle.bind(this)}>
        <FormGroup controlId="toggle">
          <Checkbox type="checkbox" checked={checked} disabled={!!disabled} readOnly/>
        </FormGroup>
        <div className="toggle-group">
          <label className="btn btn-primary toggle-on">{spinner || 'On'}</label>
          <label className="btn btn-default active toggle-off">{spinner || 'Off'}</label>
          <span className="toggle-handle btn btn-default"/>
        </div>
      </div>
    )
  }
}
