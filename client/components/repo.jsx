import React from 'react'
import { Row, Col, Panel, Button } from 'react-bootstrap'
import Toggle from './toggle.jsx'

export default class Repo extends React.Component {
  static propTypes = {
    repo: React.PropTypes.object.isRequired,
    onToggle: React.PropTypes.func.isRequired
  }

  render() {
    const onToggle = this.props.onToggle
    const { name, html_url, zapprEnabled, isUpdating } = this.props.repo
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
            <Toggle checked={zapprEnabled} {...{className, onToggle, isUpdating}}/>
          </Col>
        </Row>
      </Panel>
    )
  }
}
