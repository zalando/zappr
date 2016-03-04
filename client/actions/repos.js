import RepoService from '../service/RepoService'
import { PENDING, SUCCESS, ERROR } from '../actions/status'

export const GET_REPOS = Symbol('create status')

const fetchRepos = (status, payload = null) => ({
  type: GET_REPOS,
  status,
  payload
})

function receiveRepos(json) {
  // sort by repo.full_name
  // can't do this in backend as fullname is not
  // a column there -.-
  json = json.sort((ra, rb) => {
    const ralc = ra.full_name.toLowerCase()
    const rblc = rb.full_name.toLowerCase()
    return ralc < rblc ?
            -1 : rblc < ralc ?
              1 : 0
  })
  return fetchRepos(SUCCESS, {
    items: json,
    receivedAt: Date.now()
  })
}

export function requestRepos(includeUpstream = false) {
  return (dispatch) => {
    dispatch(fetchRepos(PENDING))
    RepoService.fetchAll(includeUpstream).
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
