import { updateRepo as apiUpdateRepo } from './api'

export const REPO_UPDATE_REPO = 'REPO_UPDATE_REPO'
function updateRepo(id, action) {
  return {
    type: REPO_UPDATE_REPO,
    id,
    action
  }
}

export const REPO_SET_ENABLED = 'REPO_SET_ENABLED'
export function setEnabled(id, enabled) {
  return dispatch => {
    //dispatch(updateRepo(id, {type: REPO_SET_ENABLED, enabled}))
    dispatch(apiUpdateRepo({id, zapprEnabled: enabled}))
  }
}
