import sinon from 'sinon'
import { expect } from 'chai'
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
    sinon.spy(service, "transform")
    sinon.spy(service, "ship")
    service.log({id: 1})
    expect(service.transform.callCount).to.equal(1)
    expect(service.ship.callCount).to.equal(1)
  })
})
