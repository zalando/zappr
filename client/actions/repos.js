import { normalize } from 'normalizr'

import RepoService from '../service/RepoService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'
import { REPOS_SCHEMA } from '../model/schema'

export const GET_REPOS = Symbol('get repos')
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

// TODO: move into view
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
  // Normalize the server response according to a schema.
  // This will split the received data over several distinct
  // entities and reducers, making the state more manageable.
  // TODO: move into custom middleware
  const normalized = normalize(repos, REPOS_SCHEMA)
  return getRepos(SUCCESS, {
    ...normalized,
    receivedAt: Date.now()
  })
}

function requestRepos(loadAll) {
  return (dispatch) => {
    dispatch(getRepos(PENDING))
    RepoService.fetchAll(loadAll)
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
 *
 * @param {Boolean} [loadAll = false] - (Re)load all repositories
 */
export function requestReposIfNeeded(loadAll = false) {
  return (dispatch, getState) => {
    if (shouldFetchRepos(getState())) {
      return dispatch(requestRepos(loadAll))
    }
  }
}
