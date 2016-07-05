import { SUCCESS, ERROR } from '../../actions/status'
import { GET_REPOS } from '../../actions/repos'
import { PUT_CHECK, DELETE_CHECK } from '../../actions/checks'

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

export default function items(state = {}, action) {
  switch (action.type) {
    case GET_REPOS:
      switch (action.status) {
        case SUCCESS:
          // Replace all items with the normalized repositories.
          return Object.assign({}, action.payload.entities.repos)
        default:
          return state
      }
    case PUT_CHECK:
    case DELETE_CHECK:
      // Only update the check-reference for a particular repo.
      return {
        ...state,
        [action.payload.repoFullName]: repo(state[action.payload.repoFullName], action)
      }
    default:
      return state
  }
}
