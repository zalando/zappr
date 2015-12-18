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
    const {name, html_url, zapprEnabled} = this.props.repo
    const style = {
      row: {
        display: 'flex',
        alignItems: 'center'
      }
    }
    return (
      <Panel>
        <Row style={style.row}>
          <Col md={10}>
            <a href={html_url}>{name}</a>
          </Col>
          <Col md={2}>
            <Toggle checked={zapprEnabled} onToggle={onToggle}/>
          </Col>
        </Row>
      </Panel>
    )
  }
}
