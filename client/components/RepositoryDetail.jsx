import React, { Component, PropTypes } from 'react'
import { Row, Col, Panel, Badge } from 'react-bootstrap'

import RepositoryCheck from './RepositoryCheck.jsx'
import { TYPES as CHECK_TYPES } from '../service/CheckService'

const TYPE_NAMES = {
  approval: 'Approval check',
  autobranch: 'Automatic branch creation'
}

export default class RepositoryDetail extends Component {
  static propTypes = {
    repository: PropTypes.object.isRequired,
    toggleCheck: PropTypes.func.isRequired
  };

  static defaultProps = {
    repository: {checks: []}
  };

  onToggleCheck(check, isChecked) {
    this.props.toggleCheck({...check, isEnabled: isChecked});
  }

  render() {
    if (!this.props.repository.full_name) return null
    const {repository} = this.props
    const header = (
      <h2>
        {repository.full_name}
      </h2>
    )
    return (
        <Row>
          <Col md={12}>
            {header}
            <div style={{marginBottom: 30}}>
              <a href={repository.html_url}><Badge><i style={{color: 'white'}} className="fa fa-github"></i></Badge></a>&nbsp;
              <Badge><i className="fa fa-star">&nbsp;</i>{repository.stargazers_count}</Badge>&nbsp;
              <Badge><i className="fa fa-code-fork">&nbsp;</i>{repository.forks_count}</Badge>&nbsp;
              <Badge><i className="fa fa-exclamation-circle">&nbsp;</i>{repository.open_issues}</Badge>&nbsp;
            </div>
          </Col>

          <Col md={12}>
            {CHECK_TYPES.
              map(type => Object.assign({}, {
                ...repository.checks[type],
                type,
                name: TYPE_NAMES[type],
                repoId: repository.id
              })).
              map(check => (
                <RepositoryCheck key={check.type} check={check}
                                 onToggle={this.onToggleCheck.bind(this, check)}/>
              ))}
          </Col>
        </Row>
    )
  }
}
