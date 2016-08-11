import * as EVENTS from './../AuditEventTypes'

function getPrInteractionEvent(auditEvent) {
  const event_type = {
    namespace: 'internal',
    name: 'pull-request-interaction',
    version: '1'
  }
  const {id, full_name, url, clone_url, git_url, ssh_url} = auditEvent.resource.repository
  const payload = {
    repository: {id, full_name, url, clone_url, git_url, ssh_url},
    approvers: auditEvent.result.approvals.total,
    is_approved: auditEvent.result.status.state === 'success',
    pull_request: auditEvent.resource.issue,
    commit_id: auditEvent.resource.commit
  }

  return {
    id: auditEvent.id,
    event_type,
    time: auditEvent.timestamp.toISOString(),
    identity: null,
    payload
  }
}

export default function zalandoAuditTrailTransformer(auditEvent) {
  switch (auditEvent.type) {
    case EVENTS.COMMIT_STATUS_UPDATE:
      return getPrInteractionEvent(auditEvent)
    default:
      /**
       * Don't wanna throw here because:
       * 1) What would be the fallback?
       * 2) We would block people from merging their stuff.
       */
      return null
  }
}
