import { GET_REPOS } from '../../actions/repos'
import { VALIDATE_CONFIG } from '../../actions/validate'
import { PENDING, SUCCESS, ERROR } from '../../actions/status'
import { VALID, INVALID, UNKNOWN, PENDING as PENDING_VALIDATION } from '../../model/validation-status'
import { mapValues } from '../../../common/util'

export default function validations(state = {}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          return mapValues(action.payload.entities.repos, () => validation(undefined, action))
        default:
          return state
      }
    case VALIDATE_CONFIG:
      return {
        ...state,
        [action.payload.repoName]: validation(state[action.payload.repoName], action)
      }
    default:
      return state
  }
}

export function validation(state = {
  status: UNKNOWN,
  config: null,
  message: ''
}, action) {
  switch (action.type) {
    case VALIDATE_CONFIG:
      switch (action.status) {
        case PENDING:
          return {status: PENDING_VALIDATION, message: '', config: null}
        case SUCCESS:
          return {status: action.payload.body.valid ? VALID : INVALID, message: action.payload.body.message, config: action.payload.body.config}
        case ERROR:
          return {status: UNKNOWN, error: action.payload.body.error, config: null, message: ''}
      }
    default:
      return state
  }
}
