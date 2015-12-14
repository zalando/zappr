import React from 'react'
import {Link} from 'react-router'

import Row from './row.jsx'
import Col from './col.jsx'

export default class Login extends React.Component {
  render() {
    return (
      <Col gridClasses={['md-12']}>
        <Link to="/">login</Link>
      </Col>
    )
  }
}
