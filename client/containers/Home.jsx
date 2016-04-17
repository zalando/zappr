import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Row, Col, Alert } from 'react-bootstrap'

import RepositoryBrowser from '../components/RepositoryBrowser.jsx'
import { requestReposIfNeeded, filterRepos } from '../actions/repos';

function mapStateToProps(state) {
  return {
    repos: state.repos
  }
}

class Home extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired, // React Router route params
    repos: PropTypes.object.isRequired,
    requestReposIfNeeded: PropTypes.func.isRequired,
    filterRepos: PropTypes.func.isRequired
  };

  render() {
    const {repos, requestReposIfNeeded, filterRepos} = this.props
    const {error} = repos
    const selectedRepo = (this.props.params.owner && this.props.params.repository)
      ? `${this.props.params.owner}/${this.props.params.repository}`
      : null

    return (
      <Row className="zpr-home">
        <Col md={12}>
          {error ?
            <Alert bsStyle='danger'>Could not fetch repositories: {error}</Alert>
            :
            <RepositoryBrowser repos={repos}
                               fetchAll={requestReposIfNeeded}
                               filterRepos={filterRepos}
                               selected={selectedRepo}/>
          }
        </Col>
      </Row>
    )
  }
}

export default connect(mapStateToProps, {filterRepos, requestReposIfNeeded})(Home)
