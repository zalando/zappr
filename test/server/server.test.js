import supertest from 'supertest'
import MockStrategy from '../passport/MockStrategy'
import { init as initApp } from '../../server/server'
import { db } from '../../server/model'

describe('Server', () => {
  const app = initApp({PassportStrategy: MockStrategy})
  const request = supertest.agent(app.listen())

  before(async (done) => {
    try {
      await db.sync()
      await request.get('/auth/github') // Initialize session
      done()
    } catch (err) {
      done(err)
    }
  })

  describe('GET /health', () => {
    it('should respond with OK', done => {
      request
        .get('/health')
        .set('Accept', 'plain/text')
        .expect('Content-Type', /text/)
        .expect(/OK/)
        .expect(200, done)
    })
  })

  describe('GET /', () => {
    it('should respond with HTML', done => {
      request
        .get('/')
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(/^.+<\/html>$/)
        .expect(200, done)
    })
  })
})
