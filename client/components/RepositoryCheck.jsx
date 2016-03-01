import React, { Component, PropTypes } from 'react'
import { Well, Row, Col } from 'react-bootstrap'

import Toggle from './Toggle.jsx'

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
    return (
      <Well bsSize="small">
        <Row style={style}>
          <Col sm={1}>
            <Toggle checked={check.isEnabled} isUpdating={check.isUpdating} onToggle={onToggle}/>
          </Col>
          <Col sm={4}>
            <b>{check.name}</b>
          </Col>
        </Row>
      </Well>
    )
  }
}
