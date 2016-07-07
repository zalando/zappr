import { generateProblemResponseFromAppError as problem } from '../../server/middleware/problem'
import { expect } from 'chai'

describe('problem middleware', () => {
  let ERROR

  beforeEach(() => {
    ERROR = {
      expose: false, // is set by koa. true when calling ctx.throw(), false when random error was thrown
      status: 422,
      detail: 'very detailed stack trace',
      title: 'detailed explanation what happened'
    }
  })

  it('should have status and title even if there is no input', () => {
    const result = problem()
    expect(result).to.have.keys('status', 'title')
    expect(result.status).to.equal(500)
    expect(result.title).to.equal('Internal server error')
  })

  it('should convert standard errors to problems', () => {
    const message = 'something happened'
    const error = new Error(message)
    const result = problem(error)
    expect(result).to.have.keys('status', 'title')
    expect(result.status).to.equal(500)
    expect(result.title).to.equal(message)
  })

  it('should return detailed problem+json', () => {
    const result = problem(ERROR)
    expect(result).to.have.keys('status', 'detail', 'title')
    expect(result.status).to.equal(ERROR.status)
    expect(result.detail).to.equal(ERROR.detail)
    expect(result.title).to.equal(ERROR.title)
  })
})
