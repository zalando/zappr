import React, { Component, PropTypes } from 'react'
import classes from 'classnames'
import { Row, Button, Col, Alert } from 'react-bootstrap'

import RepositoryList from './RepositoryList.jsx'
import RepositoryDetail from './../containers/RepositoryDetail.jsx'

export default class RepositoryBrowser extends Component {
  static propTypes = {
    selected: PropTypes.string,
    repos: PropTypes.object.isRequired,
    fetchAll: PropTypes.func.isRequired,
    filterRepos: PropTypes.func.isRequired
  };

  onFetchAll() {
    this.props.fetchAll(true)
  }

  render() {
    const {selected, repos, fetchAll, filterRepos} = this.props
    const {isFetching} = repos.status
    const selectedRepo = repos.items[selected]
    let content = null

    if (selected && selectedRepo) {
      content = <RepositoryDetail validations={repos.validations} checks={repos.checks} repository={selectedRepo}/>
    } else if (selected) {
      content = <Alert bsStyle='danger'>We didn’t find a repository {selected}.
        <Button
          style={{marginLeft: 15}}
          disabled={isFetching}
          lg
          onClick={this.onFetchAll.bind(this)}>
          <i className={classes('fa', 'fa-refresh', {'fa-spin': isFetching})}/>&nbsp;Sync with Github
        </Button>
      </Alert>
    } else if (!selected) {
      content = <Alert bsStyle='info'>Please select a repository from the list to enable ZAPPR for it.</Alert>
    }

    return (
      <Row>
        <Col sm={8} className='col-sm-push-4'>
          {content}
        </Col>
        <Col sm={4} className='col-sm-pull-8'>
          <RepositoryList isUpdating={isFetching}
                          repositories={repos.items}
                          filterBy={repos.status.filterBy}
                          filterRepos={filterRepos}
                          fetchAll={fetchAll}
                          selected={selected}/>
        </Col>
      </Row>
    )
  }
}
