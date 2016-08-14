import supertest from 'supertest'
import MockStrategy from '../passport/MockStrategy'
import { init as initApp } from '../../server/server'
import { db } from '../../server/model'

describe('Server', () => {
  const app = initApp({PassportStrategy: MockStrategy})
  const request = supertest.agent(app.listen())

  before(async(done) => {
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

  describe('GET /change-mode', () => {
    it('should return 400 when an invalid mode is provided', done => {
      request.get('/change-mode?mode=foo')
             .expect(400, done)
    })
    it('should return 400 when no mode is provided', done => {
      request.get('/change-mode')
             .expect(400, done)
    })
  })

  describe('GET /', () => {
    it('should respond with HTML and redirect to /change-mode without cookie', done => {
      request
      .get('/')
      .set('Accept', 'text/html')
      .expect('Content-Type', /html/)
      .expect(/^.+<\/html>$/)
      .expect('Location', /change-mode/)
      .expect(302, done)
    })

    it('should respond with HTML and not redirect with cookie', async(done) => {
      try {
        await request.get('/change-mode?mode=minimal')
                     .expect('Set-Cookie', /zappr_mode=minimal/)
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
