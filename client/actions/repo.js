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
  return updateRepo(id, {type: REPO_SET_ENABLED, enabled})
}
