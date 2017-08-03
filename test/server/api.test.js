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
import { encode } from '../../common/util'

const debug = logger('test:api')

function call(mountebankCall) {
  return `${mountebankCall.method} ${mountebankCall.path}`
}

describe('API', () => {
  const testUser = require('../fixtures/github.user.a.json')
  setUserId(testUser.id)
  setUserName(testUser.login)
  let app, request
  const mountebank = new MountebankClient()
  const imposter = {
    port: 4242,
    name: 'github'
  }

  const fixtures = {
    repos: [],
    repo: null,
    repoName: null
  }

  before(async(done) => {
    // Override config values
    nconf.set('GITHUB_UI_URL', `http://localhost:${imposter.port}`)
    nconf.set('GITHUB_API_URL', `http://localhost:${imposter.port}`)
    nconf.set('HOST_ADDR', 'http://127.0.0.1:8080')

    app = initApp({PassportStrategy: MockStrategy})
    request = supertest.agent(app.listen())

    try {
      // Initialize database
      await db.createSchemas()
      await db._sync()

      // Load fixtures
      fixtures.user = testUser
      fixtures.repos = require('../fixtures/github.user.a.repos.json')
      fixtures.repo = fixtures.repos[0] // zappr
      fixtures.repoOwner = fixtures.repo.owner.login
      fixtures.repoName = fixtures.repo.name

      fixtures.repo2 = fixtures.repos[2] // hello-world
      fixtures.repo2FullName = fixtures.repo2.full_name
      fixtures.branch = require('../fixtures/github.repo.branches.json')
      fixtures.refCreated = require('../fixtures/github.repo.ref.created.json')
      fixtures.validZappr = require('../fixtures/github.zapprfile.valid.json')
      fixtures.invalidZappr = require('../fixtures/github.zapprfile.invalid.json')
      fixtures.noZappr = require('../fixtures/github.zapprfile.notfound.json')

      fixtures.pullRequests = require('../fixtures/github.pull_requests.json')
      fixtures.pullRequestComments = require('../fixtures/github.pull_request.comments.json')
      // Configure mountebank
      const mb = await mountebank.start()
      // @formatter:off
      await mb.imposter()
              .setPort(imposter.port)
              .setName(imposter.name)
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.validZappr)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/contents/.zappr.yaml`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.invalidZappr)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repos[1].full_name}/contents/.zappr.yaml`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(require('../fixtures/github.repo.hooks.json'))
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks/123`)
                  .setMethod('PATCH')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/hooks/123`)
                  .setMethod('DELETE')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.repos)
                .add()
                .predicate()
                  .setPath('/user/repos')
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.repo)
                .add()
                .predicate()
                  .setPath(`/repositories/${fixtures.repo.id}`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.user)
                .add()
                .predicate()
                  .setPath('/user')
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(404)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.noZappr)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/contents/.zappr.yaml`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(404)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.noZappr)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/contents/.zappr.yml`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.branch)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/branches/master`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.refCreated)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/git/refs`)
                  .setMethod('POST')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody({}) // irrelevant
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/contents/.zappr.yaml`)
                  .setMethod('PUT')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody({}) // also irrelevant
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/pulls`)
                  .setMethod('POST')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(require('../fixtures/github.repo.hooks.json'))
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/hooks`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/hooks/123`)
                  .setMethod('PATCH')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.branch)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/branches/master`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody({}) // irrelevant
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/branches/master/protection`)
                  .setMethod('PUT')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody({
                    contexts: ['zappr', 'travis-ci'],
                    include_admins: true
                  })
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/branches/master/protection/required_status_checks`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody({}) // irrelevant
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/branches/master/protection/required_status_checks`)
                  .setMethod('PATCH')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.pullRequests)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/pulls`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.pullRequests)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/pulls`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.pullRequestComments)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repoOwner}/${fixtures.repoName}/issues/${fixtures.pullRequests[0].number}/comments`)
                  .setMethod('GET')
                .add()
              .add()
              .stub()
                .response()
                  .setStatusCode(200)
                  .setHeader('Content-Type', 'application/json')
                  .setBody(fixtures.pullRequestComments)
                .add()
                .predicate()
                  .setPath(`/repos/${fixtures.repo2FullName}/issues/${fixtures.pullRequests[0].number}/comments`)
                  .setMethod('GET')
                .add()
              .add()
              .create()
      // @formatter:on

      done()
    } catch (err) {
      return done(err)
    }
  })

  beforeEach(done => Promise.all([
    Repository.truncate({cascade: true}),
    mountebank.reset(),
    request.get('/auth/github')
  ]).then(() => done()).catch(done))

  after(done => mountebank.stop().then(done).catch(done))

  describe('GET /api/repos', () => {
    it('should work with token and no session', async(done) => {
      try {
        await request.get('/logout')
        await request.get('/api/repos')
                     .set('Authorization', 'token 123')
                     .set('Accept', 'application/json')
                     .expect(200)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should not work without session and token', async(done) => {
      try {
        await request.get('/logout')
        await request.get('/api/repos')
                     .set('Accept', 'application/json')
                     .expect(401)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should not work with wrong token type', async(done) => {
      try {
        await request.get('/logout')
        await request.get('/api/repos')
                     .set('Authorization', 'Bearer 123')
                     .set('Accept', 'application/json')
                     .expect(401)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should not work with wrong header format', async(done) => {
      try {
        await request.get('/logout')
        await request.get('/api/repos')
                     .set('Authorization', 'token 123 foo bar')
                     .set('Accept', 'application/json')
                     .expect(401)
        done()
      } catch (e) {
        done(e)
      }
    })

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

    it('should cache the response in the database', async(done) => {
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

    it('should refresh github repos', async(done) => {
      try {
        const repos0 = (await request.get('/api/repos')).body
        expect(repos0, "repos0").to.have.property('length', 4)

        await Repository.destroy({where: {id: repos0[0].id}})

        const repos1 = (await request.get('/api/repos')).body
        expect(repos1, "repos1").to.have.property('length', 3)

        const repos2 = (await request.get('/api/repos?all=true')).body
        expect(repos2, "repos2").to.have.property('length', 4)

        // add fake repository
        await Repository.upsert({id: 1, json: '{}'})
        await UserRepository.upsert({userId: testUser.id, repositoryId: 1})
        const repos3 = (await request.get('/api/repos')).body
        expect(repos3, "repos3").to.have.property('length', 5)

        // sync with api should remove it again (because not in api)
        const repos4 = (await request.get('/api/repos?all=true')).body
        expect(repos4, "repos4").to.have.property('length', 4)

        done()
      } catch (e) {
        return done(e)
      }
    })
  })

  describe('GET /api/repos/:id', () => {
    it('should not fetch repo from GitHub when missing and autoSync == false', done => {
      request
      .get(`/api/repos/${fixtures.repo.id}`)
      .set('Authorization', 'token 123 foo bar')
      .set('Accept', 'application/json')
      .expect(404)
      .end(done)
    })

    it('should fetch repo from GitHub when missing and autoSync == true', async(done) => {
      try {
        await request
          .get(`/api/repos/${fixtures.repo.id}?autoSync=true`)
          .set('Authorization', 'token 123 foo bar')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect(({body}) => {
            expect(body).to.be.an('object')
            expect(body).to.have.deep.property('id').that.is.a('number')
          })

        const repo = await Repository.findById(fixtures.repo.id, {include: [Check]})
        expect(repo).to.be.an('object')
        expect(repo).to.have.deep.property('id', fixtures.repo.id)
        done()
      }
      catch (e) {
        done(e)
      }

    })
  })

  describe('GET /api/repos/:id/zapprfile', () => {
    it('should return the effective configuration', async(done) => {
      try {
        await request.get('/api/repos').expect(200)
        const response = await request.get(`/api/repos/${fixtures.repo.id}/zapprfile`)
        expect(response.statusCode).to.equal(200)
        expect(response.body).to.have.keys('config', 'valid', 'message')
        done()
      } catch (e) {
        done(e)
      }
    })
    it('should return the error message if there was an error during config parsing', async(done) => {
      try {
        await request.get('/api/repos').expect(200)
        const response = await request.get(`/api/repos/${fixtures.repos[1].id}/zapprfile`)
        expect(response.statusCode).to.equal(200)
        expect(response.body).to.have.keys('config', 'valid', 'message')
        expect(response.body.message).to.not.equal('')
        done()
      } catch (e) {
        done(e)
      }
    })
    it('should return 404 if there is no such repo', async(done) => {
      try {
        const response = await request.get(`/api/repos/${fixtures.repo.id}111/zapprfile`)
        expect(response.statusCode).to.equal(404)
        expect(response.body).to.have.keys('detail', 'status', 'title', 'type')
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('POST /api/hook', () => {
    it('should return THANKS', async(done) => {
      try {
        const response = await request.post('/api/hook').send({})
        expect(response.status).to.equal(200)
        expect(response.body).to.deep.equal({message: 'THANKS'})
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
      } catch (e) {
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
        await request.put(`/api/repos/${id}/approval`).send().expect(201)
        // aaaand delete again
        await request.delete(`/api/repos/${id}/approval`).send().expect(204)

        const repo = await Repository.findById(id, {include: [Check]})
        expect(repo.checks.length).to.equal(0)

        const fullName = `${fixtures.repoOwner}/${fixtures.repoName}`
        const calls = await mountebank.calls(imposter.port)
        /**
         * get repos
         * zapprfiles
         * get, update branch protection
         * get hooks, add hook
         * run approval check on pull requests
         * remove approval status on pull requests
         * get hooks, remove hook
         */
        expect(calls.length).to.equal(16)
        expect(call(calls[0])).to.equal('GET /user/repos')
        expect(call(calls[1])).to.match(/^GET \/repos\/.+?\/contents\/\.zappr\.ya?ml$/)
        expect(call(calls[2])).to.match(/^GET \/repos\/.+?\/contents\/\.zappr\.ya?ml$/)
        const [,,, ...rest] = calls
        expect(rest.map(call)).to.deep.equal([
          `GET /repos/${fullName}/hooks`,
          `PATCH /repos/${fullName}/hooks/123`,
          `GET /repos/${fullName}/branches/master`,
          `PUT /repos/${fullName}/branches/master/protection`,
          `GET /repos/${fullName}/pulls`,
          `GET /repos/${fullName}/issues/${fixtures.pullRequests[0].number}/comments`,
          `POST /repos/${fullName}/statuses/${fixtures.pullRequests[0].head.sha}`,
          `GET /repos/${fullName}/pulls`,
          `POST /repos/${fullName}/statuses/${fixtures.pullRequests[0].head.sha}`,
          `GET /repos/${fullName}/branches/master/protection/required_status_checks`,
          `PATCH /repos/${fullName}/branches/master/protection/required_status_checks`,
          `GET /repos/${fullName}/hooks`,
          `DELETE /repos/${fullName}/hooks/123`
        ])
        const updateSettings = JSON.parse(rest[10].body)
        expect(updateSettings).to.deep.equal({
          include_admins: true,
          contexts: ['travis-ci']
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('PUT /api/repos/:id/:type', () => {
    it('should create a pull request when used the first time if no zapprfile is in repo', async(done) => {
      try {
        const repos = (await request.get('/api/repos').expect(200)).body
        const id = repos[2].id
        // enable approval check
        await request.put(`/api/repos/${id}/approval`)
                     .send()
                     .expect(201)
        const repo = await Repository.findById(id, {include: [Check]})
        expect(repo.checks.length).to.equal(1)
        expect(repo.checks[0].type).to.equal('approval')
        expect(repo.welcomed).to.equal(true)

        const calls = await mountebank.calls(imposter.port)
        /**
         * 1) get repos
         * 2,3) zapprfile
         * 4) get base
         * 5) create branch
         * 6) create file
         * 7) create PR
         * 8,9) get, update web hooks
         * 10,11) get, update branch protection
         * 12-14) fetch pull requests and update status on those
         */
        expect(calls.length).to.equal(14)
        expect(call(calls[0])).to.equal('GET /user/repos')
        // 2+3 are much async and interchangeable
        expect(call(calls[1])).to.match(/^GET \/repos\/.+?\/contents\/\.zappr\.ya?ml$/)
        expect(call(calls[2])).to.match(/^GET \/repos\/.+?\/contents\/\.zappr\.ya?ml$/)
        const [,,, ...rest] = calls
        expect(rest.map(call)).to.deep.equal([
          `GET /repos/${fixtures.repo2FullName}/branches/master`,
          `POST /repos/${fixtures.repo2FullName}/git/refs`,
          `PUT /repos/${fixtures.repo2FullName}/contents/.zappr.yaml`,
          `POST /repos/${fixtures.repo2FullName}/pulls`,
          `GET /repos/${fixtures.repo2FullName}/hooks`,
          `PATCH /repos/${fixtures.repo2FullName}/hooks/123`,
          `GET /repos/${fixtures.repo2FullName}/branches/master`,
          `PUT /repos/${fixtures.repo2FullName}/branches/master/protection`,
          `GET /repos/${fixtures.repo2FullName}/pulls`,
          `GET /repos/${fixtures.repo2FullName}/issues/${fixtures.pullRequests[0].number}/comments`,
          `POST /repos/${fixtures.repo2FullName}/statuses/${fixtures.pullRequests[0].head.sha}`,
        ])
        const createBranchBody = JSON.parse(rest[1].body)
        const createZapprBody = JSON.parse(rest[2].body)
        const createPrBody = JSON.parse(rest[3].body)

        const expectedBranchName = nconf.get('ZAPPR_WELCOME_BRANCH_NAME')
        expect(createBranchBody).to.deep.equal({
          ref: `refs/heads/${expectedBranchName}`,
          sha: fixtures.branch.commit.sha
        })

        expect(createZapprBody).to.deep.equal({
          message: `Create ${nconf.get('VALID_ZAPPR_FILE_PATHS')[0]}`,
          branch: expectedBranchName,
          content: encode(nconf.get('ZAPPR_AUTOCREATED_CONFIG'))
        })

        expect(createPrBody).to.deep.equal({
          title: nconf.get('ZAPPR_WELCOME_TITLE'),
          base: repos[2].json.default_branch,
          head: expectedBranchName,
          body: nconf.get('ZAPPR_WELCOME_TEXT')
        })

        done()
      } catch (e) {
        done(e)
      }
    })

    it('should update the existing hook and add a check', async(done) => {
      try {
        const repos = (await request.get('/api/repos').expect(200)).body
        const id = repos[0].id
        // enable approval check
        await request.put(`/api/repos/${id}/approval`)
                     .send()
                     .expect(201)

        const repo = await Repository.findById(id, {include: [Check]})
        expect(repo.checks.length).to.equal(1)
        expect(repo.checks[0].type).to.equal('approval')
        const fullName = `${fixtures.repoOwner}/${fixtures.repoName}`
        const calls = await mountebank.calls(imposter.port)
        /**
         * 1. get repos
         * 2.+3. get zapprfile
         * 4.+5. get hooks, add hook
         * 6.+7. check if branch is protected, update protection
         * 8.-10. fetch pull requests and update status on those
         */
        expect(calls.length).to.equal(10)
        expect(call(calls[0])).to.equal('GET /user/repos')
        // 2+3 are much async and interchangeable
        expect(call(calls[1])).to.match(/^GET \/repos\/.+?\/contents\/\.zappr\.ya?ml$/)
        expect(call(calls[2])).to.match(/^GET \/repos\/.+?\/contents\/\.zappr\.ya?ml$/)
        const [,,, ...rest] = calls
        expect(rest.map(call)).to.deep.equal([
          `GET /repos/${fullName}/hooks`,
          `PATCH /repos/${fullName}/hooks/123`,
          `GET /repos/${fullName}/branches/master`,
          `PUT /repos/${fullName}/branches/master/protection`,
          `GET /repos/${fullName}/pulls`,
          `GET /repos/${fullName}/issues/${fixtures.pullRequests[0].number}/comments`,
          `POST /repos/${fullName}/statuses/${fixtures.pullRequests[0].head.sha}`,
        ])
        // branch protection call should have approval context
        const protectionSettings = JSON.parse(rest[3].body)
        expect(protectionSettings).to.deep.equal({
          required_status_checks: {
            include_admins: true,
            strict: false,
            contexts: ['zappr']
          },
          restrictions: null,
          enforce_admins: true
        })

        // patch call should contain hook secret
        const body = JSON.parse(rest[1].body)
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
