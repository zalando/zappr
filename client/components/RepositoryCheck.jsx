import React, { Component, PropTypes } from 'react'
import Time from 'react-time'
import { Alert, Panel, Well } from 'react-bootstrap'

import Toggle from './Toggle.jsx'

const INFO_TEXT = {
  approval: <p>The approval feature (<a href='https://zappr.readthedocs.io/en/latest/setup/#approvals'>docs</a>) blocks
    a pull request (if you
    enabled <a href='https://github.com/blog/2051-protected-branches-and-required-status-checks'>protected branches</a>)
    until it has the required amount of approvals.
  </p>,
  autobranch: <p>When enabling automatic branch creation (<a
    href='https://zappr.readthedocs.io/en/latest/setup/#autobranch'>docs</a>), Zappr will automatically
    create a branch in your repository for every opened issue.
  </p>,
  commitmessage: <p>The commit message feature (<a href='https://zappr.readthedocs.io/en/latest/setup/#commitmessages'>docs</a>)
    will check that commit messages
    in a pull request match at least one of some patterns you provide.
  </p>,
  specification: <p>The specification check (<a
    href='https://zappr.readthedocs.io/en/latest/setup/#specification'>docs</a>) will verify that a pull request's title
    and body conform to the length and content requirements.</p>
}

export default class RepositoryCheck extends Component {
  static propTypes = {
    check: PropTypes.object.isRequired,
    githubUrl: PropTypes.string,
    onToggle: PropTypes.func.isRequired
  };

  static defaultProps = {
    check: {},
    githubUrl: 'https://github.com'
  };

  render() {
    const style = {
      marginLeft: 15
    }
    const {check, onToggle} = this.props
    const checkMeta = check.isEnabled ?
      (!!check.created_by ?
        <span>was enabled by <a href={`${this.props.githubUrl}/${check.created_by}`}>@{check.created_by}</a> <Time
          value={check.createdAt} relative/></span> :
          <span>is enabled</span>) :
      <span>is disabled</span>
    const header = (
      <div>
        <Toggle checked={check.isEnabled}
                isUpdating={check.isUpdating}
                onToggle={onToggle}/>
        <b style={style}>{check.name}</b> {checkMeta}
      </div>
    )
    return (
      <Panel header={header}>
        {check.error ?
          <Alert bsStyle='danger'>
            <h4>{check.error.title}</h4>
            <p>{check.error.detail}</p>
          </Alert> : null}
        {INFO_TEXT[check.type]}
      </Panel>
    )
  }
}
