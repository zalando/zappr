export const LOGIN_GITHUB_REQUEST = 'ZAPPR_LOGIN_GITHUB_REQUEST'
function loginGithubRequest() {
  return {
    type: LOGIN_GITHUB_REQUEST
  }
}

export const LOGIN_GITHUB_SUCCESS = 'ZAPPR_LOGIN_GITHUB_SUCCESS'
function loginGithubSuccess() {
  return {
    type: LOGIN_GITHUB_SUCCESS
  }
}

export const LOGIN_GITHUB_FAILURE = 'ZAPPR_LOGIN_GITHUB_FAILURE'
function loginGithubFailure() {
  return {
    type: LOGIN_GITHUB_FAILURE
  }
}

export const LOGOUT_GITHUB_REQUEST = 'ZAPPR_LOGOUT_GITHUB_REQUEST'
function logoutGithubRequest() {
  return {
    type: LOGOUT_GITHUB_REQUEST
  }
}

export function loginGithub() {
  return (dispatch) => {
    dispatch(loginGithubRequest())
  }
}
