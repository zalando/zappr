import React, { PropTypes } from 'react'
import classes from 'classnames'
import { Button, Alert } from 'react-bootstrap'
import * as Status from '../model/verification-status'

function statusToText(state) {
  if (!state) return 'unknown'
  const {status, message} = state
  switch (status) {
    case Status.VALID:
      return 'Valid config'
    case Status.INVALID:
      return `Invalid config: ${message}`
  }
}

function statusToIcon({status}) {
  switch (status) {
    case Status.VALID:
      return <span className='fa fa-check fa-fw'/>
    case Status.INVALID:
      return <span className='fa fa-times fa-fw'/>
    default:
      return null
  }
}

function statusWrapper({status}, children) {
  const style = status === Status.VALID ? 'success' :
    status === Status.INVALID ? 'danger' : 'default'
  return <Alert bsStyle={style}>{children}</Alert>
}

export default function RepositoryConfigValidation({state, onVerify}) {
  const result = state ? statusWrapper(state, <div>{statusToIcon(state)} {statusToText(state)}</div>) : null
  return <div>
    <Button onClick={onVerify}>
      <span className={classes('fa', 'fa-fw', {
      'fa-spin': state.status === Status.PENDING,
      'fa-refresh': state.status === Status.PENDING,
      'fa-info-circle': state.status !== Status.PENDING
      })}/>
      Verify Zappr configuration
    </Button>
    {result}
  </div>
}

RepositoryConfigValidation.propTypes = {
  state: PropTypes.object,
  onVerify: PropTypes.func.isRequired
}
