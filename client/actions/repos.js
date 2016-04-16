import RepoService from '../service/RepoService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const GET_REPOS = Symbol('create status')
export const FILTER_REPOS = Symbol('filter repos')

/**
 * Update the filter for the list of repos.
 *
 * @param {string} filterBy
 */
export function filterRepos(filterBy) {
  return {
    type: FILTER_REPOS,
    payload: filterBy
  }
}

function getRepos(status, payload = null) {
  return {
    type: GET_REPOS,
    status,
    payload
  }
}

function sortRepos(repos) {
  // sort by repo.full_name
  // can't do this in backend as fullname is not a column there -.-
  return repos.sort((a, b) => {
    a = a.full_name.toLowerCase()
    b = b.full_name.toLowerCase()
    return a < b ? -1 : (b < a ? 1 : 0)
  })
}

function receiveRepos(repos) {
  return getRepos(SUCCESS, {
    items: sortRepos(repos),
    receivedAt: Date.now()
  })
}

function requestRepos(includeUpstream = false) {
  return (dispatch) => {
    dispatch(getRepos(PENDING))
    RepoService.fetchAll(includeUpstream)
               .then(json => dispatch(receiveRepos(json)))
               .catch(err => dispatch(getRepos(ERROR, err)))
  }
}

function shouldFetchRepos(state) {
  return !state.repos.isFetching
}

/**
 * Request the list of repos from the server
 * unless they are already being requested.
 */
export function requestReposIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchRepos(getState())) {
      return dispatch(requestRepos())
    }
  }
}
