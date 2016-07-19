import { v4 as generateId } from 'uuid'
import { getIn, symbolToString } from './util'
import * as EVENTS from './AuditEventTypes'

export function getCommitStatusData({status, approvals, vetos}) {
  return {
    status: status.state,
    approvals,
    vetos
  }
}

export default class AuditEvent {
  constructor(auditEventType) {
    this.timestamp = new Date()
    this.id = generateId()
    this.type = auditEventType
  }

  fromGithubEvent(githubEvent) {
    this._rawGithubEvent = githubEvent
    this.githubEvent = {
      sender: getIn(githubEvent, ['sender', 'login'], 'UKNOWN SENDER'),
      type: getIn(githubEvent, 'githubEventType')
    }
    return this
  }

  onResource(resource) {
    const repositoryId = getIn(resource, ['repository', 'id'])
    const repository = getIn(resource, ['repository', 'full_name'])
    const issue = getIn(resource, 'number')
    const commit = getIn(resource, 'commit')

    this._rawResource = resource
    this.resource = {
      repositoryId, repository, issue, commit
    }
    return this
  }

  withResult(result) {
    this._rawResult = result
    switch(this.type) {
      case EVENTS.COMMIT_STATUS_UPDATE:
        this.result = getCommitStatusData(result)
        break;
    }
    return this
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      github_event: this.githubEvent,
      zappr_event: {
        type: symbolToString(this.type),
        sender: this.githubEvent.sender
      },
      resource: this.resource,
      result: this.result
    }
  }

}
