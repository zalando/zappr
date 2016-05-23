import RepoService from '../service/RepoService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const VERIFY_CONFIG = Symbol('verify config')

function verifyConfig(status, repoName, body) {
  return {
    status,
    payload: {repoName, body},
    type: VERIFY_CONFIG
  }
}

export function requestConfigVerification({id, full_name}) {
  return dispatch => {
    dispatch(verifyConfig(PENDING, full_name))
    RepoService.verifyConfig(id)
               .then(status => dispatch(verifyConfig(SUCCESS, full_name, status)))
               .catch(error => dispatch(verifyConfig(ERROR, full_name, error)))
  }
}
