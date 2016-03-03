import React, { Component, PropTypes } from 'react'
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
    const active = this.props.active ? ' active' : ''
    return (
      <Link className={`zpr-repository-list-item list-group-item${active}`}
            to={`/repository/${this.props.repository.name}`}>
        {this.props.repository.name}
      </Link>
    )
  }
}
