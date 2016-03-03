import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Row, Col } from 'react-bootstrap'

import RepositoryBrowser from '../components/RepositoryBrowser.jsx'
import { toggleCheck } from '../actions/checks'

function mapStateToProps(state) {
  return {
    repos: state.repos
  }
}

class Home extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired, // React Router route params
    repos: PropTypes.object.isRequired,
    toggleCheck: PropTypes.func.isRequired
  };

  render() {
    const {repos, toggleCheck} = this.props
    const selectedRepo = `${this.props.params.owner}/${this.props.params.repository}`

    return (
      <Row className="zpr-home">
        <Col md={12}>
          <RepositoryBrowser repos={repos}
                             selected={selectedRepo}
                             toggleCheck={toggleCheck}/>
        </Col>
      </Row>
    )
  }
}

export default connect(mapStateToProps, {toggleCheck})(Home)
