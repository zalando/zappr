import { PENDING, SUCCESS, ERROR } from '../actions/status'
import { PUT_CHECK, DELETE_CHECK } from '../actions/checks'
import { GET_REPOS } from '../actions/repos'

function check(state = {
  error: false,
  isUpdating: false,
  isEnabled: false
}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          // When a repo loaded from the backend includes a
          // check it means that this check should be enabled.
          return {
            ...state,
            error: false,
            isUpdating: false,
            isEnabled: true
          }
        default:
          return state
      }
    case PUT_CHECK:
      switch (action.status) {
        case PENDING:
          return {...state, isUpdating: true}
        case SUCCESS:
          return {
            ...state,
            ...action.payload,
            error: false,
            isUpdating: false,
            isEnabled: true
          }
        case ERROR:
          return {
            ...state,
            error: action.payload,
            isUpdating: false
          }
        default:
          return state
      }
    case DELETE_CHECK:
      switch (action.status) {
        case PENDING:
          return {...state, isUpdating: true}
        case SUCCESS:
          return {
            error: false,
            isUpdating: false,
            isEnabled: false
          }
        case ERROR:
          return {
            ...state,
            error: action.payload,
            isUpdating: false
          }
        default:
          return state
      }
    default:
      return state
  }
}

/**
 * Map over the keys and values of an object.
 *
 * @param {Object} root
 * @param {function} callback
 * @returns {Object}
 */
function mapObject(root, callback) {
  return Object.keys(root || {}).reduce((obj, key) => ({
    ...obj, [key]: callback(key, root[key])
  }), {})
}

export default function checks(state = {}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          // The repos response from the backend was normalized. Now we need to update
          // every check of a repo with the default values from the check reducer.
          return mapObject(action.payload.entities.checks, (_, v) => check(v, action))
        default:
          return state
      }
    case PUT_CHECK:
    case DELETE_CHECK:
      return {
        ...state,
        [action.payload.checkId]: check(state[action.payload.checkId], action)
      }
    default:
      return state
  }
}
