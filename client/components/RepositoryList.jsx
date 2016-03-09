import React, { Component, PropTypes } from 'react'
import { Button, Panel, ListGroup, ListGroupItem, Input } from 'react-bootstrap'
import fuzzysearch from 'fuzzysearch'
import RepositoryListItem from './RepositoryListItem.jsx'
import classes from 'classnames'

export default class RepositoryList extends Component {
  static propTypes = {
    selected: PropTypes.string.isRequired,
    repositories: PropTypes.array.isRequired,
    isUpdating: PropTypes.bool,
    filterBy: PropTypes.string.isRequired,
    filterRepos: PropTypes.func.isRequired,
    fetchAll: PropTypes.func.isRequired
  };

  static defaultProps = {
    repositories: [],
    filterBy: '',
    isUpdating: true
  };

  onFetchAll() {
    this.props.fetchAll(true)
  }

  updateSearch(evt) {
    this.props.filterRepos(evt.target.value)
  }

  render() {
    const {selected, repositories, isUpdating, filterBy} = this.props
    const filteredRepos = repositories.filter(r => fuzzysearch(filterBy, r.full_name))
    const repoList = filteredRepos.length > 0 ?
                      filteredRepos.map((repository, i) => ((
                          <RepositoryListItem key={i} repository={repository}
                                              active={repository.full_name === selected}/>
                        ))) :
                      <ListGroupItem>Oops, no repository found! Try the button below, it could help.</ListGroupItem>
    const header = <header>
                      Repositories {isUpdating ? <i className='fa fa-refresh fa-spin' /> : `(${repositories.length})`}
                    </header>
    return (
      <Panel collapsible defaultExpanded header={header}>
        <Input type='search'
              onChange={this.updateSearch.bind(this)}
              placeholder='zalando/zappr'
              label={'Search for a repository'}/>
        <ListGroup componentClass="ul">
          {repoList}
        </ListGroup>
        <Button
            style={{width: '100%'}}
            disabled={isUpdating}
            onClick={this.onFetchAll.bind(this)}
            bsStyle='primary' lg>
            <i className={classes('fa', 'fa-refresh', {'fa-spin': isUpdating})} />&nbsp;Sync with Github
        </Button>
      </Panel>
    )
  }
}
