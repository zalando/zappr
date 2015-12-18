import React from 'react'
import { Input } from 'react-bootstrap'

export default class Toggle extends React.Component {
  static propTypes = {
    checked: React.PropTypes.bool.isRequired,
    onToggle: React.PropTypes.func.isRequired
  }

  static defaultProps = {
    checked: false
  }

  render() {
    const { checked, onToggle } = this.props
    const off = checked ? 'primary' : 'default off'
    return (
      <div className={`toggle btn btn-${off}`}
           style={{width:'58px',height:'34px'}}
           onClick={onToggle.bind(this, !checked)}>
        <Input type="checkbox" checked={checked}/>
        <div className="toggle-group">
          <label className="btn btn-primary toggle-on">On</label>
          <label className="btn btn-default active toggle-off">Off</label>
          <span className="toggle-handle btn btn-default"/>
        </div>
      </div>
    )
  }
}
