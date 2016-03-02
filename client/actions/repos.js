import RepoService from '../service/RepoService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const GET_REPOS = Symbol('create status')

const fetchRepos = (status, payload = null) => ({
  type: GET_REPOS,
  status,
  payload
})

function receiveRepos(json) {
  return fetchRepos(SUCCESS, {
    items: json,
    receivedAt: Date.now()
  })
}

function requestRepos() {
  return (dispatch) => {
    dispatch(fetchRepos(PENDING))
    RepoService.fetchAll().
      then(json => dispatch(receiveRepos(json))).
      catch(err => dispatch(fetchRepos(ERROR, err)))
  }
}

function shouldFetchRepos(state) {
  return !state.repos.isFetching
}

export function requestReposIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchRepos(getState())) {
      return dispatch(requestRepos())
    }
  }
}
