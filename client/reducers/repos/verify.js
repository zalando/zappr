import { GET_REPOS } from '../../actions/repos'
import { VERIFY_CONFIG } from '../../actions/verify'
import { PENDING, SUCCESS, ERROR } from '../../actions/status'
import { VALID, INVALID, PENDING as PENDING_VERIFY } from '../../model/verification-status'
import { mapValues } from '../../../common/util'

export default function verifications(state = {}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          return mapValues(action.payload.entities.repos, () => verification(undefined, action))
        default:
          return state
      }
    case VERIFY_CONFIG:
      return {
        ...state,
        [action.payload.repoName]: verification(state[action.payload.repoName], action)
      }
    default:
      return state
  }
}

export function verification(state = {
  status: null,
  message: ''
}, action) {
  switch (action.type) {
    case VERIFY_CONFIG:
      switch (action.status) {
        case PENDING:
          return {status: PENDING_VERIFY, message: ''}
        case SUCCESS:
          return {status: VALID, message: ''}
        case ERROR:
          return {status: INVALID, message: action.payload.body}
      }
    default:
      return state
  }
}
