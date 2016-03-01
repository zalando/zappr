import React, { Component, PropTypes } from 'react'
import { Row, Col, Panel, Badge } from 'react-bootstrap'

import RepositoryCheck from './RepositoryCheck.jsx'

export default class RepositoryDetail extends Component {
  static propTypes = {
    repository: PropTypes.object.isRequired,
    repoChecks: PropTypes.array.isRequired,
    toggleRepoCheck: PropTypes.func.isRequired
  };

  static defaultProps = {
    repository: {},
    repoChecks: [{
      name: 'approval'
    }]
  };

  onToggleRepoCheck(check, isChecked) {
    // TODO: check should be an object describing the check
    console.log('onToggleRepoCheck', check, isChecked)
    this.props.toggleRepoCheck(this.props.repository.id, isChecked);
  }

  render() {
    if (!this.props.repository.name) return null
    const {repository, repoChecks} = this.props

    const header = (
      <h3>
        <a href={repository.html_url}>{repository.name}</a>
        &nbsp;<Badge><i className="fa fa-star">&nbsp;</i>{repository.stargazers_count}</Badge>
        &nbsp;<Badge><i className="fa fa-code-fork">&nbsp;</i>{repository.forks_count}</Badge>
        &nbsp;<Badge><i className="fa fa-exclamation-circle">&nbsp;</i>{repository.open_issues}</Badge>
      </h3>
    )
    return (
      <Panel header={header}>
        <Row>
          <Col md={12}>
            {repoChecks.
            map(check => ({ // TODO: remove
              ...check,
              isUpdating: repository.isUpdating,
              isChecked: repository.checks.length > 0
            })).
            map((check, i) => (
              <RepositoryCheck key={i} check={check}
                               onToggle={this.onToggleRepoCheck.bind(this, check)}/>
            ))}
          </Col>
        </Row>
      </Panel>
    )
  }
}
