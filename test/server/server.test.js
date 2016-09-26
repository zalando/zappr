import supertest from 'supertest'
import MockStrategy from '../passport/MockStrategy'
import { init as initApp } from '../../server/server'
import { db } from '../../server/model'

describe('Server', () => {
  const app = initApp({PassportStrategy: MockStrategy})
  const request = supertest.agent(app.listen())

  before(async(done) => {
    try {
      await db.createSchemas()
      await db._sync()
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

  describe('GET /change-access-level', () => {
    it('should return 400 when an invalid mode is provided', done => {
      request.get('/change-access-level?level=foo')
             .expect(400, done)
    })
    it('should return 400 when no mode is provided', done => {
      request.get('/change-access-level')
             .expect(400, done)
    })
  })

  describe('GET /', () => {
    it('should respond with HTML and redirect to /change-access-level without cookie', done => {
      request
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /html/)
      .expect(/^.+<\/html>$/)
      .expect('Location', /change-access-level/)
      .expect(302, done)
    })

    it('should respond with HTML and not redirect with cookie', async(done) => {
      try {
        await request.get('/change-access-level?level=extended')
                     .expect('Set-Cookie', /zappr_access_level=extended/)
                     .expect('Set-Cookie', /httponly/)
                     .expect('Set-Cookie', /expires/)

        request
        .get('/')
        .set('Accept', 'text/html')
        .expect('Content-Type', /html/)
        .expect(/^.+<\/html>$/)
        .expect(200, done)
      } catch (e) {
        done(e)
      }
    })
  })
})
