import React, { Component, PropTypes } from 'react'
import { Panel, ListGroup } from 'react-bootstrap'

import RepositoryListItem from './RepositoryListItem.jsx'

export default class RepositoryList extends Component {
  static propTypes = {
    selected: PropTypes.string.isRequired,
    repositories: PropTypes.array.isRequired
  };

  static defaultProps = {
    repositories: []
  };

  render() {
    const style = {
      list: {
        maxHeight: '75%',
        overflowY: 'scroll'
      }
    }
    const {selected, repositories} = this.props
    return (
      <Panel collapsible defaultExpanded header="Repositories">
        <ListGroup componentClass="ul" fill style={style.list}>
          {(() => (
            repositories.length === 0
              ? (<span className="list-group-item text-center">
                  <i className="fa fa-2x fa-spinner fa-pulse"/>
                </span>)
              : repositories.map((repository, i) => ((
              <RepositoryListItem key={i} repository={repository}
                                  active={repository.name === selected}/>
            )))
          ))()}
        </ListGroup>
      </Panel>
    )
  }
}
