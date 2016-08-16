import * as EVENTS from '../AuditEventTypes'
import nconf from '../../../nconf'

function getRepo({id, full_name, url, clone_url, git_url, ssh_url}) {
  return {id, full_name, url, clone_url, git_url, ssh_url}
}

function getPrInteractionEvent(auditEvent) {
  const event_type = {
    namespace: 'internal',
    name: 'pull-request-interaction',
    version: '1'
  }
  const payload = {
    repository: getRepo(auditEvent.resource.repository),
    approvers: auditEvent.result.approvals.total,
    is_approved: auditEvent.result.status.state === 'success',
    pull_request: auditEvent.resource.issue,
    commit_id: auditEvent.resource.commit
  }

  return {
    id: auditEvent.id,
    event_type,
    triggered_at: auditEvent.timestamp.toISOString(),
    payload
  }
}

function getPrMergedEvent(auditEvent) {
  const event_type = {
    namespace: 'internal',
    name: 'pull-request-merged',
    version: '1'
  }
  const payload = {
    repository: getRepo(auditEvent.resource.repository),
    pull_request: auditEvent.resource.issue,
    merged_at: new Date(auditEvent.resource.pull_request.merged_at).toISOString(), // github has no milliseconds
    default_branch: auditEvent._rawResource.repository.default_branch,
    result_commit_id: auditEvent.resource.pull_request.merge_commit_sha,
    base_ref: auditEvent.resource.pull_request.base.ref,
    head: {
      repository: getRepo(auditEvent.resource.pull_request.head.repo),
      ref: auditEvent.resource.pull_request.head.ref,
      commit_id: auditEvent.resource.pull_request.head.sha
    }
  }
  return {
    id: auditEvent.id,
    event_type,
    triggered_at: auditEvent.timestamp.toISOString(),
    triggered_by: {
      type: nconf.get('GITHUB_UI_URL') === 'https://github.com' ? 'GITHUB_LOGIN' : 'EMPLOYEE_USERNAME',
      id: auditEvent.user
    },
    payload
  }
}

export default function zalandoAuditTrailTransformer(auditEvent) {
  switch (auditEvent.type) {
    case EVENTS.COMMIT_STATUS_UPDATE:
      return getPrInteractionEvent(auditEvent)
    case EVENTS.PULL_REQUEST_MERGED:
      return getPrMergedEvent(auditEvent)
    default:
      return {}
  }
}
