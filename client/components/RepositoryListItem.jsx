import React, { Component, PropTypes } from 'react'
import classes from 'classnames'
import { Link } from 'react-router'

export default class RepositoryListItem extends Component {
  static propTypes = {
    active: PropTypes.bool.isRequired,
    repository: PropTypes.object.isRequired
  };

  static defaultProps = {
    repository: {}
  };

  render() {
    const {repository, active} = this.props
    const hasChecks = Object.keys(repository.checks).filter(c => repository.checks[c].enabled).length > 0
    return (
      <Link className={classes('zpr-repository-list-item', 'list-group-item', {active: active})}
            to={`/repository/${repository.full_name}`}>
        <i className={classes('fa', 'fa-fw', hasChecks ? 'fa-circle' : 'fa-circle-o')} />&nbsp; {repository.full_name}
      </Link>
    )
  }
}
