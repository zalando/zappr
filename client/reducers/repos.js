import { PENDING, SUCCESS, ERROR } from '../actions/status'
import { GET_REPOS, FILTER_REPOS } from '../actions/repos'
import { PUT_CHECK, DELETE_CHECK } from '../actions/checks'
import { logger } from '../../common/debug'

const log = logger('repos')

function repo(state = {checks: []}, action) {
  // After normalizing a repo only as a list of check ids.
  // The actual checks are in a separate check entity.
  switch (action.type) {
    case PUT_CHECK:
      switch (action.status) {
        case SUCCESS:
          return {
            ...state,
            checks: [...state.checks, action.payload.checkId]
          }
        default:
          return state
      }
      break
    case DELETE_CHECK:
      switch (action.status) {
        case SUCCESS:
          return {
            ...state,
            checks: state.checks.filter(id => id !== action.payload.checkId)
          }
        default:
          return state
      }
    default:
      return state
  }
}

// TODO: move repository list attributes (isFetching, error, etc.) into separate entity/reducer
export default function repos(state = {
  isFetching: false,
  error: false,
  filterBy: '',
  items: {}
}, action) {
  switch (action.type) {
    case FILTER_REPOS:
      return Object.assign({}, state, {
        filterBy: action.payload
      })
    case GET_REPOS:
      switch (action.status) {
        case PENDING:
          return Object.assign({}, state, {
            isFetching: true,
            error: false
          })
        case SUCCESS:
          return Object.assign({}, state, {
            isFetching: false,
            error: false,
            lastUpdated: action.payload.receivedAt,
            items: action.payload.entities.repos
          })
        case ERROR:
          log(action.payload)
          return Object.assign({}, state, {
            isFetching: false,
            error: action.payload
          })
        default:
          return state
      }
    case PUT_CHECK:
    case DELETE_CHECK:
      // Only update the check-reference for a particular repo.
      return {
        ...state,
        items: {
          ...state.items,
          [action.payload.repoFullName]: repo(state.items[action.payload.repoFullName], action)
        }
      }
    default:
      return state
  }
}
