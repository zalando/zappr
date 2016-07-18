import { getIn, symbolToString } from '../../../common/util'
import * as EVENTS from './AuditEvents'
import { v4 as generateId } from 'uuid'
import { logger } from '../../../common/debug'
const error = logger('audit', 'error')

export function getCommitStatusData({status, approvals, vetos}) {
  return {
    status: status.state,
    approvals,
    vetos
  }
}

export default class AuditService {
  constructor(opts = {}) {
    this.options = opts
  }

  /**
   * Same as log(), but doesn't wait.
   */
  logSync() {
    try {
      this.ship(this.transform(...arguments))
    } catch (e) {
      error(e)
    }
  }

  /**
   * Same API as transform(). Convenience method to transform + ship.
   */
  async log() {
    try {
      await this.ship(this.transform(...arguments))
    } catch (e) {
      error(e)
    }
  }

  /**
   * Transforms various event data to single JSON object that will be logged.
   *
   * @param eventType - the type of the zappr event
   * @param metaInfo - meta information about the event, e.g. repository, githubEvent, pr/issue number, commit sha...
   * @param eventData - the actual data for the zappr event, e.g. commit state
   * @returns {{id, github_event: {type: string, sender: string}, resource: {repositoryId: number, repository: string, pull_request: number, commit: string}, zappr_event: {type: string, sender: string}, timestamp: string, result: {}}}
   */
  transform(eventType, metaInfo, eventData) {
    const repositoryId = metaInfo.repository.id
    const sender = getIn(metaInfo, ['githubEvent', 'sender', 'login'], 'UNKNOWN SENDER')
    switch (eventType) {
      case EVENTS.COMMIT_STATUS_UPDATE:
        const {number, commit} = metaInfo
        return {
          id: generateId(),
          timestamp: new Date().toISOString(),
          github_event: {
            type: metaInfo.githubEvent.githubEventId,
            sender
          },
          zappr_event: {
            type: symbolToString(EVENTS.COMMIT_STATUS_UPDATE),
            sender
          },
          resource: {
            repositoryId,
            repository: metaInfo.repository.full_name,
            pull_request: number,
            commit
          },
          result: getCommitStatusData(eventData)
        }
    }
  }

  /**
   * Ships the result from transform() to whatever destination, e.g. a log file or a remote API
   *
   * @param body
   */
  async ship(body) {
    throw new Error('Implement in subclass')
  }
}
