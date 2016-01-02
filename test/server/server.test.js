import webpack from 'webpack'
import supertest from 'supertest'

import { logger } from '../../common/debug'
const log = logger('test')

const compiler = webpack(require('../../webpack.server'))

describe('Server', () => {
  let app, request

  before(function (done) {
    this.timeout(8000)
    log('compiling webpack distribution...')

    compiler.run(err => {
      if (err) return done(err)

      app = require('../../dist/server/server.min').app
      request = supertest.agent(app.listen())
      done()
    })
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
