import React, { Component, PropTypes } from 'react'
import { Panel, Well, Row, Col } from 'react-bootstrap'

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
      display: 'flex',
      alignItems: 'center'
    }
    const {check, onToggle} = this.props
    const header = (<Row style={style}>
      <Col sm={2}>
        <Toggle checked={check.isEnabled} isUpdating={check.isUpdating} onToggle={onToggle}/>
      </Col>
      <Col sm={4} style={{marginLeft: 15}}>
        <b>{check.type}</b> check is {check.isEnabled ? 'enabled' : 'disabled'}
      </Col>
    </Row>)
    return (
      <Panel header={header}>
        {INFO_TEXT[check.type]}
      </Panel>
    )
  }
}
