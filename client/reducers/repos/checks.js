import { PENDING, SUCCESS, ERROR } from '../../actions/status'
import { PUT_CHECK, DELETE_CHECK, REFRESH_TOKEN } from '../../actions/checks'
import { GET_REPOS } from '../../actions/repos'
import { mapValues } from '../../../common/util'

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

export default function checks(state = { isRefreshingToken: false, error: false}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          // The repos response from the backend was normalized. Now we need to update
          // every check of a repo with the default values from the check reducer.
          return mapValues(action.payload.entities.checks, (_, v) => check(v, action))
        default:
          return state
      }
    case REFRESH_TOKEN:
      switch(action.status) {
        case PENDING:
          return {...state, isRefreshingToken: true}
        case SUCCESS:
          // console.log(action.payload);
          return {
            ...state,
            isRefreshingToken: false,
            error: false
          }
        case ERROR: 
          return {
            ...state,
            isRefreshingToken: false,
            error: action.payload
          }
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
