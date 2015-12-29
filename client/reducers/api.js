//import { REPO_UPDATE_REPO, REPO_SET_ENABLED } from '../actions/repo'
import {
  API_REQUEST_REPOS,
  API_RECEIVE_REPOS,
  API_SEND_REPO_UPDATE,
  API_COMPLETE_REPO_UPDATE,
  API_FAIL_REPO_UPDATE
} from '../actions/api'

import { logger } from '../../common/debug'
const log = logger('api')

function githubRepo(state = {
  zapprEnabled: false,
  isUpdating: false
}, action) {
  switch (action.type) {
    //case REPO_SET_ENABLED:
    //  return Object.assign({}, state, {
    //    zapprEnabled: action.enabled
    //  })
    case API_SEND_REPO_UPDATE:
      return Object.assign({}, state, {
        isUpdating: true
      })
    case API_COMPLETE_REPO_UPDATE:
      return Object.assign({}, state, {
        isUpdating: false,
        zapprEnabled: action.repo.zapprEnabled
      })
    case API_FAIL_REPO_UPDATE:
      return Object.assign({}, state, {
        isUpdating: false,
        zapprEnabled: !action.repo.zapprEnabled
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
    //case REPO_UPDATE_REPO:
    //{
    //  const i = state.repos.findIndex(repo => repo.id === action.id)
    //  if (i === -1) {
    //    log('error, no repo for id %s', action.id)
    //    return state
    //  }
    //  return Object.assign({}, state, {
    //    repos: [
    //      ...state.repos.slice(0, i),
    //      githubRepo(state.repos[i], action.action),
    //      ...state.repos.slice(i + 1)
    //    ]
    //  })
    //}
    case API_SEND_REPO_UPDATE:
    case API_COMPLETE_REPO_UPDATE:
    case API_FAIL_REPO_UPDATE:
    {
      const i = state.repos.findIndex(repo => repo.id === action.repo.id)
      if (i === -1) {
        log('error, no repo for id %s', action.repo.id)
        return state
      }
      return Object.assign({}, state, {
        repos: [
          ...state.repos.slice(0, i),
          githubRepo(state.repos[i], action),
          ...state.repos.slice(i + 1)
        ]
      })
    }
    default:
      return state
  }
}
