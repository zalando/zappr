import { PENDING, SUCCESS, ERROR } from '../../actions/status'
import { GET_REPOS, FILTER_REPOS } from '../../actions/repos'
import { logger } from '../../../common/debug'

const log = logger('repos')

export default function status(state = {
  isFetching: false,
  error: false,
  filterBy: ''
}, action) {
  switch (action.type) {
    case FILTER_REPOS:
      return {...state, filterBy: action.payload}
    case GET_REPOS:
      switch (action.status) {
        case PENDING:
          return {
            ...state,
            isFetching: true,
            error: false
          }
        case SUCCESS:
          return {
            ...state,
            isFetching: false,
            error: false,
            lastUpdated: action.payload.receivedAt
          }
        case ERROR:
          log(action.payload)
          return {
            ...state,
            isFetching: false,
            error: action.payload
          }
        default:
          return state
      }
    default:
      return state
  }
}
