import { expect } from 'chai'
import AuditEvent from '../../../server/service/audit/AuditEvent'
import * as EVENTS from '../../../server/service/audit/AuditEventTypes'
import transform from '../../../server/service/audit/transform/ZalandoAuditTrail'

const issueWebhook = require('../../fixtures/webhook.issue_comment.json')

describe('The AuditTrailTransformer', () => {
  describe('should produce correct output (pr-interaction)', () => {
    const commitId = '123'
    const status = {state: 'success'}
    const auditEvent = new AuditEvent(EVENTS.COMMIT_STATUS_UPDATE).fromGithubEvent(issueWebhook)
                                                                  .onResource({
                                                                    commit: commitId,
                                                                    number: 1,
                                                                    repository: issueWebhook.repository
                                                                  })
                                                                  .withResult({
                                                                    approvals: { total: ['foo', 'bar'] },
                                                                    vetos: [],
                                                                    status
                                                                  })
    const result = transform(auditEvent)

    it('[envelope]', () => {
      expect(result).to.be.a('object')
                    .and.have.all.keys('id', 'triggered_at', 'event_type', 'payload')
      expect(result.id).to.be.a('string').and.equal(auditEvent.id)
      expect(result.triggered_at).to.be.a('string').and.equal(auditEvent.timestamp.toISOString())
      expect(result.event_type).to.be.a('object')
                               .and.have.all.keys('namespace', 'name', 'version')
                               .and.deep.equal({
        namespace: 'internal',
        name: 'pull-request-interaction',
        version: '1'
      })
      expect(result.payload).to.be.a('object')
                            .and.have.all.keys('repository', 'approvers', 'is_approved', 'pull_request', 'commit_id')
    })

    it('[payload.repository]', () => {
      expect(result.payload.repository).to.be.a('object')
                                       .and.have.all.keys('id', 'full_name', 'url', 'git_url', 'clone_url', 'ssh_url')
                                       .and.deep.equal({
        id: issueWebhook.repository.id,
        full_name: issueWebhook.repository.full_name,
        url: issueWebhook.repository.url,
        git_url: issueWebhook.repository.git_url,
        ssh_url: issueWebhook.repository.ssh_url,
        clone_url: issueWebhook.repository.clone_url
      })
    })

    it('[payload.approvers]', () => {
      expect(result.payload.approvers).to.be.a('array')
                                      .and.deep.equal(['foo', 'bar'])
    })

    it('[payload.is_approved]', () => {
      expect(result.payload.is_approved).to.be.a('boolean')
                                        .and.equal(true)
    })

    it('[payload.pull_request]', () => {
      expect(result.payload.pull_request).to.be.a('number')
                                         .and.equal(1)
    })

    it('[payload.commit_id]', () => {
      expect(result.payload.commit_id).to.be.a('string')
                                      .and.equal(commitId)
    })
  })
})
