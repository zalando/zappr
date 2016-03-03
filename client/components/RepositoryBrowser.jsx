import React, { Component, PropTypes } from 'react'
import { Row, Col } from 'react-bootstrap'

import RepositoryList from './RepositoryList.jsx'
import RepositoryDetail from './RepositoryDetail.jsx'

export default class RepositoryBrowser extends Component {
  static propTypes = {
    selected: PropTypes.string.isRequired,
    repos: PropTypes.object.isRequired,
    toggleCheck: PropTypes.func.isRequired
  };

  static defaultProps = {
    selected: '',
    repos: {items: []}
  };

  render() {
    const {selected, repos, toggleCheck} = this.props
    const selectedRepo = repos.items.find(r => r.name === selected)
    return (
      <Row>
        <Col sm={3}>
          <RepositoryList isUpdating={repos.isFetching} repositories={repos.items} selected={selected}/>
        </Col>
        <Col sm={9}>
          <RepositoryDetail repository={selectedRepo}
                            toggleCheck={toggleCheck}/>
        </Col>
      </Row>
    )
  }
}
