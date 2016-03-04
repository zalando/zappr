import React, { Component, PropTypes } from 'react'
import { Panel, Well } from 'react-bootstrap'

import Toggle from './Toggle.jsx'

const INFO_TEXT = {
  approval: 'TODO approval infotext'
}

export default class RepositoryCheck extends Component {
  static propTypes = {
    check: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired
  };

  static defaultProps = {
    check: {}
  };

  render() {
    const style = {
      marginLeft: 15
    }
    const {check, onToggle} = this.props
    const header = (
      <div>
        <Toggle checked={check.isEnabled} isUpdating={check.isUpdating} onToggle={onToggle}/>
        <b style={style}>{check.type}</b> check is {check.isEnabled ? 'enabled' : 'disabled'}
      </div>
    )
    return (
      <Panel header={header}>
        {INFO_TEXT[check.type]}
      </Panel>
    )
  }
}
