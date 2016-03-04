import React, { Component, PropTypes } from 'react'
import { Row, Button, Col, Alert } from 'react-bootstrap'

import RepositoryList from './RepositoryList.jsx'
import RepositoryDetail from './RepositoryDetail.jsx'

export default class RepositoryBrowser extends Component {
  static propTypes = {
    selected: PropTypes.string.isRequired,
    repos: PropTypes.object.isRequired,
    toggleCheck: PropTypes.func.isRequired,
    fetchAll: PropTypes.func.isRequired
  };

  static defaultProps = {
    selected: '',
    repos: {items: []}
  };

  onFetchAll() {
    this.props.fetchAll(true)
  }

  render() {
    const {selected, repos, fetchAll, toggleCheck} = this.props
    const selectedRepo = repos.items.find(r => r.full_name === selected)
    let content = null
    if (selected && selectedRepo) {
        content = <RepositoryDetail
                      repository={selectedRepo}
                      toggleCheck={toggleCheck}/>
    } else if (selected && !repos.isFetching) {
      content = <Alert bsStyle='danger'>We didn’t find a repository {selected}.
                  <Button
                      style={{marginLeft: 15}}
                      disabled={repos.isFetching}
                      lg
                      onClick={this.onFetchAll.bind(this)}>
                    <i className='fa fa-refresh' />&nbsp;Load all from Github
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
          <RepositoryList isUpdating={repos.isFetching}
                          repositories={repos.items}
                          fetchAll={fetchAll}
                          selected={selected}/>
        </Col>
      </Row>
    )
  }
}
