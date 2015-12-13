import supertest from 'supertest'

import {app} from '../../server/server'

describe('Server', () => {
  const request = supertest.agent(app.listen())

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
        .expect(/<!doctype html>/)
        .expect(200, done)
    })
  })
})
