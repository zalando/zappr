import sinon from 'sinon'
import { expect } from 'chai'
import nconf from '../../../server/nconf'
import AuditEvent from '../../../server/service/audit/AuditEvent'
import * as EVENTS from '../../../server/service/audit/AuditEventTypes'
import AuditService from '../../../server/service/audit/AuditService'

describe('The AuditService', () => {
  let service, logger, transformer
  beforeEach(() => {
    logger = sinon.spy()
    transformer = sinon.spy()
    service = new AuditService(logger, transformer)
  })

  it('#ship() should call logFn', () => {
    service.ship({id: 1})
    expect(logger.callCount).to.equal(1)
    expect(logger.args[0]).to.deep.equal([{id: 1}])
  })

  it('#log() should call ship() and transform()', () => {
    nconf.set('AUDIT_RELEVANT_ORGS', false)
    sinon.spy(service, "transform")
    sinon.spy(service, "ship")
    service.log({id: 1})
    expect(service.transform.callCount).to.equal(1)
    expect(service.ship.callCount).to.equal(1)
  })

  it('#log() should log everything without org filter', () => {
    nconf.set('AUDIT_RELEVANT_ORGS', false)
    const auditEvent = new AuditEvent(EVENTS.COMMIT_STATUS_UPDATE).onResource({
      repository: {
        full_name: 'foo/bar'
      }
    })
    service.log(auditEvent)
    expect(logger.called).to.be.true
  })

  it('#log() should honor the organization filter, when set', () => {
    nconf.set('AUDIT_RELEVANT_ORGS', ['foo'])
    sinon.spy(service, "ship")

    const auditEventBar = new AuditEvent(EVENTS.COMMIT_STATUS_UPDATE).onResource({
      repository: {
        full_name: 'not-foo/bar'
      }
    })
    service.log(auditEventBar)
    expect(service.ship.called).to.be.false

    const auditEventFoo = new AuditEvent(EVENTS.COMMIT_STATUS_UPDATE).onResource({
      repository: {
        full_name: 'foo/bar'
      }
    })
    service.log(auditEventFoo)
    expect(service.ship.called).to.be.true
  })
})
