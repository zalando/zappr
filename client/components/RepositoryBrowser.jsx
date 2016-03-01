import React, { Component, PropTypes } from 'react'
import { Row, Col } from 'react-bootstrap'

import RepositoryList from './RepositoryList.jsx'
import RepositoryDetail from './RepositoryDetail.jsx'

export default class RepositoryBrowser extends Component {
  static propTypes = {
    selected: PropTypes.string.isRequired,
    repositories: PropTypes.array.isRequired,
    toggleRepoCheck: PropTypes.func.isRequired
  };

  static defaultProps = {
    selected: '',
    repositories: []
  };

  render() {
    const {selected, repositories, toggleRepoCheck} = this.props
    const repository = repositories.find(r => r.name === selected)
    return (
      <Row>
        <Col sm={3}>
          <RepositoryList selected={selected} repositories={repositories}/>
        </Col>
        <Col sm={9}>
          <RepositoryDetail repository={repository}
                            toggleRepoCheck={toggleRepoCheck}/>
        </Col>
      </Row>
    )
  }
}
