import { expect } from 'chai'
import AuditEvent from '../../../server/service/audit/AuditEvent'
import * as EVENTS from '../../../server/service/audit/AuditEventTypes'
import transform from '../../../server/service/audit/transform/ZalandoAuditTrail'
import nconf from '../../../server/nconf'

const issueWebhook = require('../../fixtures/webhook.issue_comment.json')
const mergeWebhook = require('../../fixtures/webhook.pull_request.merge.json')


describe('The AuditTrailTransformer', () => {
  describe('should produce correct output (pr-merged)', () => {
    const {repository, pull_request, number} = mergeWebhook
    const auditEvent = new AuditEvent(EVENTS.PULL_REQUEST_MERGED).fromGithubEvent(mergeWebhook)
                                                                 .onResource({
                                                                   repository,
                                                                   pull_request,
                                                                   issue_number: number
                                                                 })
                                                                 .byUser(pull_request.merged_by.login)
    const result = transform(auditEvent)

    it('[envelope]', () => {

      expect(result).to.be.a('object')
                    .and.have.all.keys('triggered_at', 'triggered_by', 'event_type', 'payload')
      expect(result.triggered_at).to.be.a('string')
                                 .and.equal(auditEvent.timestamp.toISOString())
      expect(result.event_type).to.be.a('object')
                               .and.have.all.keys('namespace', 'name', 'version')
                               .and.deep.equal({
        namespace: 'internal',
        name: 'pull-request-merged',
        version: '1'
      })
      expect(result.payload).to.be.an('object')
                            .and.have.all.keys('repository', 'pull_request', 'merged_at', 'default_branch', 'result_commit_id', 'base_ref', 'head')
    })

    it('[envelope.triggered_by GHE]', () => {
      nconf.set('GITHUB_UI_URL', 'https://some.other.github.com')
      const result = transform(auditEvent)
      expect(result.triggered_by).to.an('object')
                                 .and.have.all.keys('type', 'id')
      expect(result.triggered_by.type).to.equal('EMPLOYEE_USERNAME')
    })

    it('[envelope.triggered_by GH.com]', () => {
      nconf.set('GITHUB_UI_URL', 'https://github.com')
      const result = transform(auditEvent)
      expect(result.triggered_by).to.an('object')
                                 .and.have.all.keys('type', 'id')
      expect(result.triggered_by.type).to.equal('GITHUB_LOGIN')
    })

    it('[payload.repository]', () => {
      expect(result.payload.repository).to.be.a('object')
                                       .and.have.all.keys('id', 'full_name', 'url', 'git_url', 'clone_url', 'ssh_url')
                                       .and.deep.equal({
        id: mergeWebhook.repository.id,
        full_name: mergeWebhook.repository.full_name,
        url: mergeWebhook.repository.url,
        git_url: mergeWebhook.repository.git_url,
        ssh_url: mergeWebhook.repository.ssh_url,
        clone_url: mergeWebhook.repository.clone_url
      })
    })

    it('[payload.pull_request]', () => {
      expect(result.payload.pull_request).to.be.a('number')
                                         .and.equal(mergeWebhook.pull_request.number)
    })

    it('[payload.merged_at]', () => {
      expect(result.payload.merged_at).to.be.a('string')
                                      .and.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
                                      .and.equal(new Date(result.payload.merged_at).toISOString())
    })

    it('[payload.default_branch]', () => {
      expect(result.payload.default_branch).to.be.a('string')
                                           .and.equal(mergeWebhook.repository.default_branch)
    })

    it('[payload.result_commit_id]', () => {
      expect(result.payload.result_commit_id).to.be.a('string')
                                             .and.equal(mergeWebhook.pull_request.merge_commit_sha)
    })

    it('[payload.base_ref]', () => {
      expect(result.payload.base_ref).to.be.a('string')
                                     .and.equal(mergeWebhook.pull_request.base.ref)
    })
    it('[payload.head]', () => {
      expect(result.payload.head).to.be.an('object')
                                 .and.have.all.keys('repository', 'commit_id', 'ref')
      expect(result.payload.head.commit_id).to.be.a('string')
                                           .and.equal(mergeWebhook.pull_request.head.sha)
      expect(result.payload.head.ref).to.be.a('string')
                                     .and.equal(mergeWebhook.pull_request.head.ref)
      expect(result.payload.head.repository).to.be.an('object')
                                            .and.have.all.keys('id', 'full_name', 'url', 'git_url', 'clone_url', 'ssh_url')
                                            .and.deep.equal({
        id: mergeWebhook.pull_request.head.repo.id,
        full_name: mergeWebhook.pull_request.head.repo.full_name,
        url: mergeWebhook.pull_request.head.repo.url,
        git_url: mergeWebhook.pull_request.head.repo.git_url,
        ssh_url: mergeWebhook.pull_request.head.repo.ssh_url,
        clone_url: mergeWebhook.pull_request.head.repo.clone_url
      })
    })

  })

  describe('should produce correct output (pr-interaction)', () => {
    const commitId = '123'
    const status = {state: 'success'}
    const auditEvent = new AuditEvent(EVENTS.COMMIT_STATUS_UPDATE).fromGithubEvent(issueWebhook)
                                                                  .onResource({
                                                                    commit: commitId,
                                                                    issue_number: 1,
                                                                    repository: issueWebhook.repository
                                                                  })
                                                                  .withResult({
                                                                    approvals: {total: ['foo', 'bar']},
                                                                    vetos: [],
                                                                    status
                                                                  })
    const result = transform(auditEvent)

    it('[envelope]', () => {
      expect(result).to.be.a('object')
                    .and.have.all.keys('triggered_at', 'event_type', 'payload')
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
