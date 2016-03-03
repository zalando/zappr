import { expect } from 'chai'

import Approval from '../../server/checks/Approval'
import { db, User, Repository, Check } from '../../server/model'

const reposJson = require('../fixtures/github.user.repos.json')
const userJson = require('../fixtures/github.user.json')

describe('Model', () => {

  before(done => db.sync().then(done).catch(done))

  beforeEach(done => Promise.all([
      User.truncate(),
      Repository.truncate()
    ]).
    then(() => done()).catch(done))

  describe('User', () => {
    it('should return the "json" property as an object', async(done) => {
      const userId = userJson.id

      try {
        await User.create({id: userId, json: userJson})
        const user = await User.findById(userId)

        expect(user.get('json')).to.be.an('object')
        expect(user.get('json')).to.have.property('id', userId)

        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('Repository', () => {
    it('should return the "json" property as an object', async(done) => {
      const repoJson = reposJson[0]
      const repoId = repoJson.id
      const userId = userJson.id

      try {
        await User.create({id: userId, json: userJson})
        await Repository.create({id: repoId, userId, json: repoJson})
        const repo = await Repository.userScope(userJson).findById(repoId)

        expect(repo.get('json')).to.be.an('object')
        expect(repo.get('json')).to.have.property('id', repoId)
        expect(repo.get('json')).to.have.property('name').which.is.a('string')

        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('Check', () => {
    it('should return the decrypted token', async(done) => {
      const repoJson = reposJson[0]
      const repositoryId = repoJson.id
      const userId = userJson.id
      const checkId = 42
      const token = 'abcd'

      try {
        await User.create({id: userId, json: userJson})
        await Repository.create({id: repositoryId, userId, json: repoJson})
        await Check.create({id: checkId, token, repositoryId, type: Approval.type, arguments: {}})
        const check = await Check.findById(checkId)

        expect(check.get('token')).to.equal(token)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
