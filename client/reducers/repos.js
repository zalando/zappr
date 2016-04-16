import { PENDING, SUCCESS, ERROR } from '../actions/status'
import { GET_REPOS, FILTER_REPOS } from '../actions/repos'
import { PUT_CHECK, DELETE_CHECK } from '../actions/checks'
import { logger } from '../../common/debug'

const log = logger('repos')

function initChecks(repo) {
  return repo.checks.map(c => ({
               type: c.type,
               error: false,
               isUpdating: false,
               enabled: true
             }))
             .reduce((state, check) => {
               state[check.type] = check
               return state
             }, {})
}

/**
 * {
 *   checks: {
 *     approval: {
 *       error, isUpdating, enabled, type
 *     },
 *     autobranch: {
 *
 *     }
 *   }
 * }
 */

function check(state = {
  error: false,
  isUpdating: false,
  enabled: true
}, action) {
  if (!action) return state

  if (action.type === PUT_CHECK || action.type === DELETE_CHECK) {
    if (action.status === PENDING) {
      return Object.assign({}, {
        isUpdating: true,
        error: false
      })
    } else if (action.status === SUCCESS) {
      return Object.assign({}, {
        isUpdating: false,
        error: false,
        enabled: action.type === PUT_CHECK
      })
    } else if (action.status === ERROR) {
      return Object.assign({}, {
        isUpdating: false,
        error: action.payload
      })
    }
  }
  return state
}

function checks(state = {}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          return action.payload.checks
                       .map(c => ({...c, ...check()}))
                       .reduce((checks, check) => {
                         checks[check.type] = check
                         return checks
                       }, {})
        default:
          return state
      }
    case PUT_CHECK:
    case DELETE_CHECK:
      return {
        ...state,
        [action.payload.type]: check(state[action.payload.type], action)
      }
    default:
      return state
  }
}

function repo(state = {
  isUpdating: false,
  error: false,
  checks: []
}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          return Object.assign({}, state, {
            checks: checks(state.checks, action)
          })
        default:
          return state
      }
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
        default:
          return state
      }
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
            //FIXME
            items: action.payload.items.map(repository => repo(repository, {...action, payload: repository})),
            lastUpdated: action.payload.receivedAt
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
      log(action)
      const i = state.items.findIndex(repo => repo.id === action.payload.repoId)
      if (i === -1) {
        const msg = `ERROR no repo for id ${action.payload.repoId}`
        log(msg)
        return Object.assign({}, state, {error: msg})
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
