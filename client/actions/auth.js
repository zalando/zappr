import { pushPath } from 'redux-simple-router'

import { logger } from '../../common/debug'
const log = logger('auth')

export const LOGIN_GITHUB_REQUEST = 'ZAPPR-LOGIN-GITHUB-REQUEST'
export const LOGIN_GITHUB_SUCCESS = 'ZAPPR-LOGIN-GITHUB-SUCCESS'
export const LOGIN_GITHUB_FAILURE = 'ZAPPR-LOGIN-GITHUB-FAILURE'
export const LOGOUT_GITHUB = 'ZAPPR-LOGOUT-GITHUB'

export default {
  loginGithub,
  logoutGithub
}

function loginGithubRequest() {
  return {
    type: LOGIN_GITHUB_REQUEST
  }
}

function loginGithubSuccess() {
  return {
    type: LOGIN_GITHUB_SUCCESS
  }
}

function loginGithubFailure() {
  return {
    type: LOGIN_GITHUB_FAILURE
  }
}

function loginGithub(redirect = '/') {
  return (dispatch) => {
    dispatch(loginGithubRequest())
    new Promise(resolve => (
      setTimeout(resolve, 200)
    )).
    then(() => {
      log('log in success :)')
      dispatch(loginGithubSuccess())
      dispatch(pushPath(redirect))
    }).
    catch(err => {
      log('log in failure :(', err)
      dispatch(loginGithubFailure())
    })
  }
}

function logoutGithub() {
  return (dispatch) => {
    dispatch(pushPath('/login'))
    dispatch({
      type: LOGOUT_GITHUB
    })
  }
}
