import RepoService from '../service/RepoService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const VALIDATE_CONFIG = Symbol('validate config')

function validateConfig(status, repoName, body) {
  return {
    status,
    payload: {
      repoName,
      body
    },
    type: VALIDATE_CONFIG
  }
}

export function requestConfigValidation({id, full_name}) {
  return dispatch => {
    dispatch(validateConfig(PENDING, full_name))
    RepoService.validateConfig(id)
               .then(status => dispatch(validateConfig(SUCCESS, full_name, status)))
               .catch(error => dispatch(validateConfig(ERROR, full_name, {error})))
  }
}
