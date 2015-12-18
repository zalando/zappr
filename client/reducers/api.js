import { REPO_UPDATE_REPO, REPO_SET_ENABLED } from '../actions/repo'
import {
  API_REQUEST_REPOS,
  API_RECEIVE_REPOS,
  API_SEND_REPO_UPDATE,
  API_COMPLETE_REPO_UPDATE
} from '../actions/api'

import { logger } from '../../common/debug'
const log = logger('api')

function githubRepo(state = {
  zapprEnabled: false
}, action) {
  switch (action.type) {
    case REPO_SET_ENABLED:
      return Object.assign({}, state, {
        zapprEnabled: action.enabled
      })
  }
}

export function githubRepos(state = {
  isFetching: false,
  repos: []
}, action) {
  switch (action.type) {
    case API_REQUEST_REPOS:
      return Object.assign({}, state, {
        isFetching: true
      })
    case API_RECEIVE_REPOS:
      return Object.assign({}, state, {
        isFetching: false,
        repos: action.repos,
        lastUpdated: action.receivedAt
      })
    case REPO_UPDATE_REPO:
      const i = state.repos.findIndex(repo => repo.id === action.id)
      if (i === -1) {
        log('error, no repo for id %s', action.id)
        return state
      }
      return Object.assign({}, state, {
        repos: [
          ...state.repos.slice(0, i),
          githubRepo(state.repos[i], action.action),
          ...state.repos.slice(i + 1)
        ]
      })
    case API_SEND_REPO_UPDATE:
      log('API_SEND_REPO_UPDATE')
      return state // TODO
    case API_COMPLETE_REPO_UPDATE:
      log('API_COMPLETE_REPO_UPDATE')
      return state // TODO
    default:
      return state
  }
}
