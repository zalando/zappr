import React, { Component, PropTypes } from 'react'
import { Panel, ListGroup } from 'react-bootstrap'

import RepositoryListItem from './RepositoryListItem.jsx'
import Spinner from './Spinner.jsx'

export default class RepositoryList extends Component {
  static propTypes = {
    selected: PropTypes.string.isRequired,
    repositories: PropTypes.array.isRequired,
    isUpdating: PropTypes.bool
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
    const {selected, repositories, isUpdating} = this.props
    return (
      <Panel collapsible defaultExpanded header="Repositories">
        <ListGroup componentClass="ul" fill style={style.list}>
          {(() => (
            isUpdating
              ? (<Spinner size={2}/>)
              : repositories.map((repository, i) => ((
              <RepositoryListItem key={i} repository={repository}
                                  active={repository.full_name === selected}/>
            )))
          ))()}
        </ListGroup>
      </Panel>
    )
  }
}
