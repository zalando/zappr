import React from 'react'

import bootstrap from 'bootstrap/dist/css/bootstrap.css'

import Container from './container.jsx'
import Row from './row.jsx'
import Col from './col.jsx'

export default class App extends React.Component {
  render() {
    return (
      <Container>
        <Row>
          <Col gridClasses={['md-12']}>
            <h1>Hello, World</h1>
          </Col>
        </Row>
      </Container>
    )
  }
}
