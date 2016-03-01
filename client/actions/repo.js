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
export function setRepoEnabled(id, enabled) {
  return dispatch => {
    //dispatch(updateRepo(id, {type: REPO_SET_ENABLED, enabled}))
    // TODO: zapprEnabled and updateRepo are deprecated. Create a new check resource instead.
    dispatch(apiUpdateRepo({id, zapprEnabled: enabled}))
  }
}
