import sinon from 'sinon'
import winston, {Logger} from 'winston'
import { expect } from 'chai'
import AuditService from '../../server/service/audit/AuditService'
import FileAuditService from '../../server/service/audit/FileAuditService'
import ZalandoAuditService from '../../server/service/audit/ZalandoAuditService'
import ZalandoAuditTrailTransport from '../../server/service/audit/ZalandoAuditTrailTransport'

describe('The AuditService', () => {
  let service, logger
  beforeEach(() => {
    logger = {
      info: sinon.spy(),
      add: sinon.spy()
    }
    service = new AuditService().withLogger(logger)
  })

  it('#ship() should call logger.info', () => {
    service.ship({ id: 1 })
    expect(logger.info.callCount).to.equal(1)
    expect(logger.info.args[0]).to.deep.equal([{ id: 1 }])
  })

  it('#log() should call ship() and transform()', () => {
    sinon.spy(service, "transform")
    sinon.spy(service, "ship")
    service.log({ id: 1 })
    expect(service.transform.callCount).to.equal(1)
    expect(service.ship.callCount).to.equal(1)
  })
})

describe('The FileAuditService', () => {
  it('#withLogger() should configure the logger', () => {
    const options = { filename: 'audit.log' }
    const service = new FileAuditService(options)
    const logger = new Logger()
    sinon.spy(logger, "add")
    sinon.spy(service, "withLogger")
    service.withLogger(logger)
    expect(logger.add.callCount).to.equal(1)
    expect(logger.add.calledWith(winston.transports.File, options)).to.be.true
  })
})

describe('The ZalandoAuditService', () => {
  it('#withLogger() should configure the logger', () => {
    const options = { url: 'https://trail.zalando' }
    const service = new ZalandoAuditService(options)
    const logger = new Logger()
    sinon.spy(logger, "add")
    sinon.spy(service, "withLogger")
    service.withLogger(logger)
    expect(logger.add.callCount).to.equal(1)
    expect(logger.add.calledWith(ZalandoAuditTrailTransport, options)).to.be.true
  })
})
