import React, { Component, PropTypes } from 'react'
import { Row, Col, Panel, Button } from 'react-bootstrap'
import Toggle from './toggle.jsx'

export default class Repo extends Component {
  static propTypes = {
    repo: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired
  };

  render() {
    const onToggle = this.props.onToggle
    const { name, html_url, checks, isUpdating } = this.props.repo
    const toggleIsChecked = checks.length > 0
    const className = 'pull-right'
    const style = {
      row: {
        display: 'flex',
        alignItems: 'center'
      }
    }
    return (
      <Panel>
        <Row style={style.row}>
          <Col xs={9} sm={10} md={10}>
            <a href={html_url}>{name}</a>
          </Col>
          <Col xs={3} sm={2} md={2}>
            <Toggle checked={toggleIsChecked} {...{className, onToggle, isUpdating}}/>
          </Col>
        </Row>
      </Panel>
    )
  }
}
