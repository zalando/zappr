import fetch from 'isomorphic-fetch'

import { logger } from '../../common/debug'
const log = logger('api')

export const API_REQUEST_REPOS = 'ZAPPR_API_REQUEST_REPOS'
function requestRepos() {
  return {
    type: API_REQUEST_REPOS
  }
}

export const API_RECEIVE_REPOS = 'ZAPPR_API_RECEIVE_REPOS'
function receiveRepos(json) {
  return {
    type: API_RECEIVE_REPOS,
    repos: json,
    receivedAt: Date.now()
  }
}

function fetchRepos() {
  return dispatch => {
    dispatch(requestRepos())

    return fetch('/api/repos', {
      credentials: 'same-origin'
    }).
    then(response => response.json()).
    then(json =>
      dispatch(receiveRepos(json)))
  }
}

function shouldFetchRepos(state) {
  return !state.githubRepos.isFetching
}

export function fetchReposIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchRepos(getState())) {
      return dispatch(fetchRepos())
    }
  }
}
