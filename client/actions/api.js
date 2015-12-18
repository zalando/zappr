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

export const API_SEND_REPO_UPDATE = 'API_SEND_REPO_UPDATE'
function sendRepoUpdate(json) {
  return {
    type: API_SEND_REPO_UPDATE,
    repo: json
  }
}

export const API_COMPLETE_REPO_UPDATE = 'API_COMPLETE_REPO_UPDATE'
function completeRepoUpdate(json) {
  return {
    type: API_COMPLETE_REPO_UPDATE,
    repo: json
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

export function updateRepo(repo) {
  return dispatch => {
    dispatch(sendRepoUpdate(repo))

    return fetch(`/api/repos/${repo.id}`, {
      method: 'put',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(repo),
      credentials: 'same-origin'
    }).
    then(response => response.json()).
    then(json =>
      dispatch(completeRepoUpdate(json)))
  }
}
