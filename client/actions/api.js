import RepoService from '../service/repo-service'

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

export const API_FAIL_REPO_UPDATE = 'API_FAIL_REPO_UPDATE'
function failRepoUpdate(repo, error) {
  return {
    type: API_FAIL_REPO_UPDATE,
    repo: repo,
    error: error
  }
}

function fetchRepos() {
  return dispatch => {
    dispatch(requestRepos())

    return RepoService.fetchAll()
      .then(json => dispatch(receiveRepos(json)))
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

/**
 * @deprecated Repositories cannot be changed. Add or remove 'checks' instead.
 */
export function updateRepo(repo) {
  return dispatch => {
    dispatch(sendRepoUpdate(repo))

    return RepoService.updateOne(repo)
      .then(json => dispatch(completeRepoUpdate(json)))
      .catch(error => dispatch(failRepoUpdate(repo, error)))
  }
}
