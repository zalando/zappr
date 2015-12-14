import React from 'react'
import {connect} from 'react-redux'
import {pushState} from 'redux-router'

import Container from './container.jsx'
import Row from './row.jsx'
import Col from './col.jsx'

class App extends React.Component {
  static propTypes = {
    children: React.PropTypes.node
  }

  componentDidMount() {
    this.props.dispatch(pushState(null, '/login'))
  }

  render() {
    return (
      <Container>
        <Row>
          <Col gridClasses={['md-12']}>
            <h1>ZAPPR</h1>
          </Col>
        </Row>
        <Row>
          {this.props.children}
        </Row>
      </Container>
    )
  }
}

function mapStateToProps(state) {
  return {}
}

export default connect(mapStateToProps)(App)
