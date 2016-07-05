import supertest from 'supertest-as-promised'
import { expect } from 'chai'
import crypto from 'crypto'

import nconf from '../../server/nconf'
import Problem from '../../common/Problem'
import MountebankClient from '../MountebankClient'
import MockStrategy, { setUserId, setUserName } from '../passport/MockStrategy'
import { init as initApp } from '../../server/server'
import { db, Repository, Check, UserRepository } from '../../server/model'
import { logger } from '../../common/debug'

const debug = logger('test:api')

describe('API', () => {
  const testUser = require('../fixtures/github.user.a.json')
  setUserId(testUser.id)
  setUserName(testUser.login)
  const app = initApp({PassportStrategy: MockStrategy})
  const mountebank = new MountebankClient()
  const request = supertest.agent(app.listen())
  const imposter = {
    port: 4242,
    name: 'github'
  }

  const fixtures = {
    repos: [],
    repo: null,
    repoName: null
  }

  before(async (done) => {
    // Override config values
    nconf.set('GITHUB_UI_URL', `http://localhost:${imposter.port}`)
    nconf.set('GITHUB_API_URL', `http://localhost:${imposter.port}`)
    nconf.set('HOST_ADDR', 'http://127.0.0.1:8080')

    try {
      // Initialize database
      await db.sync()

      // Load fixtures
      fixtures.user = testUser
      fixtures.repos = require('../fixtures/github.user.a.repos.json')
      fixtures.repo = fixtures.repos[0]
      fixtures.repoOwner = fixtures.repo.owner.login
      fixtures.repoName = fixtures.repo.name

      // Configure mountebank
      const mb = await mountebank.start()
      await mb.imposter().
      setPort(imposter.port).
      setName(imposter.name).
      stub().
        response().
          setStatusCode(200).
          setHeader('Content-Type', 'application/json').
          setBody(require('../fixtures/github.repo.hooks.json')).
        add().
        predicate().
          setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks`).
          setMethod('GET').
        add().
      add().
      stub().
        response().
          setStatusCode(200).
        add().
        predicate().
          setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks/123`).
          setMethod('PATCH').
        add().
      add().
      stub().
        response().
          setStatusCode(200).
        add().
        predicate().
          setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks/123`).
          setMethod('DELETE').
        add().
      add().
      stub().
        response().
          setStatusCode(200).
          setHeader('Content-Type', 'application/json').
          setBody(fixtures.repos).
        add().
        predicate().
          setPath('/user/repos').
          setMethod('GET').
        add().
      add().
      stub().
        response().
          setStatusCode(200).
          setHeader('Content-Type', 'application/json').
          setBody(fixtures.user).
        add().
        predicate().
          setPath('/user').
          setMethod('GET').
        add().
      add().
      create()

      // Initialize session
      request.get('/auth/github').end(done)
    } catch (err) {
      return done(err)
    }
  })

  beforeEach(done => Promise.all([
    Repository.truncate(),
    mountebank.reset()
  ]).then(() => done()).catch(done))

  after(done => mountebank.stop().then(done).catch(done))

  describe('GET /api/repos', () => {
    it('should respond with github repos', done => {
      request
        .get('/api/repos')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(({body}) => {
          expect(body).to.be.an('array').and.to.have.length.above(1)
          expect(body).to.have.deep.property('[0].id').that.is.a('number')
          expect(body).to.have.deep.property('[0].checks').that.is.a('array')
          expect(body).to.have.deep.property('[0].json').that.is.an('object')
        })
        .end(done)
    })

    it('should exclude the github token from the checks', async(done)=> {
      try {
        // Reload repositories
        await request.get('/api/repos').expect(200)
        // Enable a check
        await request.put(`/api/repos/${fixtures.repo.id}/approval`).expect(201)

        const repos = (await request.get('/api/repos')).body
        const repo = repos.find(repo => repo.id === fixtures.repo.id)
        let check = repo.checks[0]

        expect(check).to.be.an('object')
        expect(check).to.not.have.property('token')

        // Fetch a single repository
        const {body} = await request.get(`/api/repos/${fixtures.repo.id}`)
        check = body.checks[0]
        expect(check).to.be.an('object')
        expect(check).to.not.have.property('token')

        done()
      } catch (e) {
        return done(e)
      }
    })

    it('should cache the response in the database', async (done) => {
      try {
        const {body} = await request.get('/api/repos')
        // Load repos from the database and transform
        // them into a format equal to the HTTP response.
        const repos = await Repository.userScope(fixtures.user)
          .findAllSorted({include: [Check]})
          .then(repos => repos.map(r => r.toJSON()))
          .then(repos => repos.map(r => JSON.stringify(r)))
          .then(repos => repos.map(r => JSON.parse(r)))

        expect(repos).to.have.length.above(0)
        expect(body).to.have.length.above(0)
        expect(repos).to.deep.include.members(body)

        done()
      } catch (e) {
        return done(e)
      }
    })

    it('should refresh github repos', async (done) => {
      try {
        const repos0 = (await request.get('/api/repos')).body
        expect(repos0).to.have.property('length', 4)

        await Repository.destroy({where: {id: repos0[0].id}})

        const repos1 = (await request.get('/api/repos')).body
        expect(repos1).to.have.property('length', 3)

        const repos2 = (await request.get('/api/repos?all=true')).body
        expect(repos2).to.have.property('length', 4)

        // add fake repository
        await Repository.upsert({id: 1, json: ''})
        await UserRepository.upsert({userId: testUser.id, repositoryId: 1})
        const repos3 = (await request.get('/api/repos')).body
        expect(repos3).to.have.property('length', 5)

        // sync with api should remove it again (because not in api)
        const repos4 = (await request.get('/api/repos?all=true')).body
        expect(repos4).to.have.property('length', 4)

        done()
      } catch (e) {
        return done(e)
      }
    })
  })

  describe('POST /api/hook', () => {
    it('should return THANKS', async(done) => {
      try {
        const response = await request.post('/api/hook').send({})
        expect(response.status).to.equal(200)
        expect(response.body).to.deep.equal({ message: 'THANKS' })
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should validate x-hub-signature if provided', async(done) => {
      try {
        await request.get('/api/repos')
        const body = {repository: fixtures.repo}
        const sha1 = crypto.createHmac('sha1', 'captainHook')
        const signature = sha1.update(JSON.stringify(body)).digest('hex')

        // wrong signature => 400
        await request
              .post('/api/hook')
              .set('X-Hub-Signature', 'foo')
              .send(body)
              .expect(400)

        // no signature => 200
        await request
              .post('/api/hook')
              .send(body)
              .expect(200)

        // correct signature => 200
        await request
              .post('/api/hook')
              .set('X-Hub-Signature', `sha1=${signature}`)
              .send(body)
              .expect(200)

        done()
      } catch(e) {
        done(e)
      }
    })
  })

  describe('DELETE /api/repos/:id/:type', () => {
    it('should delete a check and the webhook', async(done) => {
      try {
        // add check first
        const repos = (await request.get('/api/repos').expect(200)).body
        const id = repos[0].id
        await request.
          put(`/api/repos/${id}/approval`).
          send().
          expect(201)
        // aaaand delete again
        await request.
          delete(`/api/repos/${id}/approval`).
          send().
          expect(204)

        const repo = await Repository.findById(id, {include: [Check]})
        expect(repo.checks.length).to.equal(0)

        const calls = await mountebank.calls(imposter.port)
        expect(calls.length).to.equal(5)
        expect(calls[4].method).to.equal('DELETE')
        expect(calls[4].path).to.equal(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks/123`)

        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('PUT /api/repos/:id/:type', () => {
    it('should update the existing hook and add a check', async(done) => {
      try {
        const repos = (await request.get('/api/repos').expect(200)).body
        const id = repos[0].id
        // enable approval check
        await request.
          put(`/api/repos/${id}/approval`).
          send().
          expect(201)

        const repo = await Repository.findById(id, {include: [Check]})
        expect(repo.checks.length).to.equal(1)
        expect(repo.checks[0].type).to.equal('approval')
        const calls = await mountebank.calls(imposter.port)
        expect(calls.length).to.equal(3)
        expect(calls[0].method).to.equal('GET')
        expect(calls[0].path).to.equal('/user/repos')
        expect(calls[1].method).to.equal('GET')
        expect(calls[1].path).to.equal(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks`)
        expect(calls[2].method).to.equal('PATCH')
        expect(calls[2].path).to.equal(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks/123`)
        // patch call should contain hook secret
        const body = JSON.parse(calls[2].body)
        expect(body).to.have.deep.property('config.secret')
        expect(body.config.secret).to.equal('captainHook')
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should return a Problem when accessing a non-existing repository', async(done) => {
      try {
        const {body} = await request.put('/api/repos/4242/approval').send()
        const problem = new Problem(body)
        debug('Response: %o', body)
        expect(problem).to.have.property('status').that.is.a('number').and.above(400)
        expect(problem).to.have.property('title').that.is.a('string').and.not.empty
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should return a Problem when accessing a non-existing check', async(done) => {
      try {
        const repos = (await request.get('/api/repos').expect(200)).body
        const id = repos[0].id
        const {body} = await request.put(`/api/repos/${id}/foobar`).send()
        const problem = new Problem(body)
        debug('Response: %o', body)
        expect(problem).to.have.property('status').that.is.a('number').and.above(400)
        expect(problem).to.have.property('title').that.is.a('string').and.not.empty
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
