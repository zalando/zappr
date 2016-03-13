import checks, {init as initChecks} from './checks'
import { PENDING, SUCCESS, ERROR } from '../actions/status'
import { GET_REPOS, FILTER_REPOS } from '../actions/repos'
import { PUT_CHECK, DELETE_CHECK } from '../actions/checks'
import { logger } from '../../common/debug'

const log = logger('repos')

function repo(state = {
  isUpdating: false,
  error: false,
  checks: []
}, action) {
  switch (action.type) {
    case PUT_CHECK:
      switch (action.status) {
        case PENDING:
          return Object.assign({}, state, {
            isUpdating: true,
            checks: checks(state.checks, action),
            error: false
          })
        case SUCCESS:
          return Object.assign({}, state, {
            isUpdating: false,
            checks: checks(state.checks, action),
            error: false
          })
        case ERROR:
          log(action.payload)
          return Object.assign({}, state, {
            isUpdating: false,
            checks: checks(state.checks, action),
            error: action.payload
          })
          return state
      }
      break
    case DELETE_CHECK:
      switch (action.status) {
        case PENDING:
          return Object.assign({}, state, {
            isUpdating: true,
            checks: checks(state.checks, action),
            error: false
          })
        case SUCCESS:
          return Object.assign({}, state, {
            isUpdating: false,
            error: false,
            checks: checks(state.checks, action)
          })
        case ERROR:
          log(action.payload)
          return Object.assign({}, state, {
            isUpdating: false,
            checks: checks(state.checks, action),
            error: action.payload
          })
          return state
      }
      break
    default:
      return state
  }
}

export default function repos(state = {
  isFetching: false,
  error: false,
  filterBy: '',
  items: []
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
            items: action.payload.items.map(repo => Object.assign(repo, {checks: initChecks(repo)})),
            lastUpdated: action.payload.receivedAt
          })
        case ERROR:
          log(action.payload)
          return Object.assign({}, state, {
            isFetching: false,
            error: action.payload
          })
          return state
      }
      break
    case PUT_CHECK:
    case DELETE_CHECK:
      log(action)
      const i = state.items.findIndex(repo => repo.id === action.payload.repoId)
      if (i === -1) {
        const msg = `ERROR no repo for id ${action.payload.repoId}`
        log(msg)
        return Object.assign({}, state, { error: msg })
      }
      return Object.assign({}, state, {
        items: [
          ...state.items.slice(0, i),
          repo(state.items[i], action),
          ...state.items.slice(i + 1)
        ]
      })
    default:
      return state
  }
}
