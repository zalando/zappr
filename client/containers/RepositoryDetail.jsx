import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Row, Col, Badge, Button } from 'react-bootstrap'
import DocumentTitle from 'react-document-title'

import RepositoryCheck from './../components/RepositoryCheck.jsx'
import ConfigValidation from './../components/RepositoryConfigValidation.jsx'
import { toggleCheck } from '../actions/checks'
import { requestConfigValidation } from '../actions/validate'

import { checkId } from '../model/schema'
import { CHECK_TYPES, CHECK_NAMES } from '../../server/checks'

function mapStateToProps(state) {
  return {
    githubUrl: state.env.GITHUB_UI_URL
  }
}

class RepositoryDetail extends Component {
  static propTypes = {
    repository: PropTypes.object.isRequired,
    checks: PropTypes.object.isRequired,
    validations: PropTypes.object.isRequired,
    githubUrl: PropTypes.string,
    toggleCheck: PropTypes.func.isRequired,
    requestConfigValidation: PropTypes.func.isRequired
  };

  onToggleCheck(check, isChecked) {
    this.props.toggleCheck({...check, isEnabled: isChecked})
  }

  onValidateConfig(repo) {
    this.props.requestConfigValidation(repo)
  }

  shouldRefreshToken() {
    console.log("refresh Token");
    // this.props.requestNewToken();
  }

  render() {
    if (!this.props.repository.full_name) return null
    const {repository, checks, validations} = this.props
    const header = (<h2>{repository.full_name}</h2>)

    return (
      <DocumentTitle title={`${repository.full_name} - Zappr`}>
        <Row>
          <Col md={12}>
            {header}
            <div style={{marginBottom: 30}}>
              <a href={repository.html_url}>
                <Badge>
                  <i style={{color: 'white'}} className="fa fa-github">&nbsp;</i>
                </Badge>&nbsp;
              </a>
              <Badge><i className="fa fa-star">&nbsp;</i>{repository.stargazers_count}</Badge>&nbsp;
              <Badge><i className="fa fa-code-fork">&nbsp;</i>{repository.forks_count}</Badge>&nbsp;
              <Badge><i className="fa fa-exclamation-circle">&nbsp;</i>{repository.open_issues}</Badge>&nbsp;
            </div>
          </Col>
          <Col md={12}>
            <ConfigValidation
              validation={validations[repository.full_name]}
              onValidate={this.onValidateConfig.bind(this, repository)}
              refreshToken={this.shouldRefreshToken()}/>
          </Col>
          <Col md={12}>
            {CHECK_TYPES
            .map(type => ({
              type,
              name: CHECK_NAMES[type],
              repoId: repository.id,
              repoFullName: repository.full_name,
              checkId: checkId(repository.id, type),
              ...checks[checkId(repository.id, type)]
            }))
            .map(check => (
              <RepositoryCheck key={check.type}
                               check={check}
                               githubUrl={this.props.githubUrl}
                               onToggle={this.onToggleCheck.bind(this, check)}/>
            ))}
          </Col>
        </Row>
      </DocumentTitle>
    )
  }
}

export default connect(mapStateToProps, {toggleCheck, requestConfigValidation})(RepositoryDetail)
