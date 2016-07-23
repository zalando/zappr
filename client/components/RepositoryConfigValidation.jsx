import React, { PropTypes } from 'react'
import classes from 'classnames'
import { Button, Alert, Panel } from 'react-bootstrap'
import * as Status from '../model/validation-status'
import { unescape } from '../../common/util'
import yaml from 'js-yaml'

function statusToText(status) {
  switch (status) {
    case Status.VALID:
      return `Valid config`
    case Status.INVALID:
      return `Invalid config`
  }
}

function statusToIcon(status) {
  switch (status) {
    case Status.VALID:
      return <span className='fa fa-check fa-fw'/>
    case Status.INVALID:
      return <span className='fa fa-times fa-fw'/>
    default:
      return null
  }
}

function statusToBsStyle(status) {
  switch (status) {
    case Status.VALID:
      return 'success'
    case Status.INVALID:
      return 'danger'
    default:
      return null
  }
}

function validationFinished(status) {
  return status === Status.VALID || status === Status.INVALID
}

class Result extends React.Component {
  constructor() {
    super()
    this.toggleEffectiveConfig = this._toggleEffectiveConfig.bind(this)
    this.state = {
      expanded: false
    }
  }

  _toggleEffectiveConfig() {
    this.setState({
      expanded: !this.state.expanded
    })
  }

  render() {
    const {message, status, config} = this.props.validation
    if (!validationFinished(status)) {
      return null
    }
    const header = <span>
      <span className={classes('fa', 'fa-fw', {
      'fa-caret-right': !this.state.expanded,
      'fa-caret-down': this.state.expanded
      })} /> Effective configuration</span>
    return <div>
      <h4>{statusToIcon(status)} {statusToText(status)}</h4>
      {message ? <pre>{message}</pre> : null}
      <Panel collapsible
             expanded={this.state.expanded}
             onClick={this.toggleEffectiveConfig}
             header={header}>
      <pre>
        {config ? unescape(yaml.safeDump(config)) : ''}
      </pre>
      </Panel>
    </div>
  }
}

export default function RepositoryConfigValidation({validation, onValidate}) {
  const placeholder = <div style={{marginTop: '1em'}} />
  let result = placeholder
  if (validationFinished(validation.status)) {
    result = <Alert style={{marginTop: '1em'}} bsStyle={statusToBsStyle(validation.status)}>
      <Result validation={validation} />
    </Alert>
  } else if (validation.error) {
    result = <Alert style={{marginTop: '1em'}} bsStyle='danger'>{validation.error.status} {validation.error.title}</Alert>
  }
  return <div>
    <Button onClick={onValidate}>
      <span className={classes('fa', 'fa-fw', {
        'fa-spin': validation.status === Status.PENDING,
        'fa-refresh': validation.status === Status.PENDING,
        'fa-info-circle': validation.status !== Status.PENDING
      })}/>
        Validate Zappr configuration
    </Button>
    {result}
  </div>
}

RepositoryConfigValidation.propTypes = {
  validation: PropTypes.shape({
    status: PropTypes.symbol,
    message: PropTypes.string,
    config: PropTypes.object
  }).isRequired,
  onValidate: PropTypes.func.isRequired
}
