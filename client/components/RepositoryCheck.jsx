import React, { Component, PropTypes } from 'react'
import { Alert, Panel, Well } from 'react-bootstrap'

import Toggle from './Toggle.jsx'

const INFO_TEXT = {
  approval: <p>Once you enabled the Approval check, ZAPPR will set a
               commit status on every PR in your repository, much like <a href='https://travis-ci.org'>Travis</a>.
               It will look for comments that match a regex (default: <code>/^:\+1:$/</code>) and count
               those as approvals to merge. If your PR has enough approvals 
               (default: <code>2</code>) the status will be set to successful.
               By default ZAPPR will count comments from anyone, but you can
               configure this in your <a href='https://github.com/zalando/zappr/tree/master/.zappr-example.yml'>
               <code>.zappr.yml</code></a> file.</p>
}

export default class RepositoryCheck extends Component {
  static propTypes = {
    check: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired
  };

  static defaultProps = {
    check: {}
  };

  render() {
    const style = {
      marginLeft: 15
    }
    const {check, onToggle} = this.props
    const header = (
      <div>
        <Toggle checked={check.isEnabled} isUpdating={check.isUpdating} onToggle={onToggle}/>
        <b style={style}>{check.type}</b> check is {check.isEnabled ? 'enabled' : 'disabled'}
      </div>
    )
    return (
      <Panel header={header}>
        {check.error ? <Alert bsStyle='danger'>Error: {check.error.message}</Alert> : null}
        {INFO_TEXT[check.type]}
      </Panel>
    )
  }
}
