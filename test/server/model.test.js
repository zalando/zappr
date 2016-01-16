import { expect } from 'chai'
import { sync, User, Repository } from '../../server/model'

import { logger } from '../../common/debug'
const log = logger('test')

const reposJson = require('../fixtures/github.user.repos.json')
const userJson = require('../fixtures/github.user.json')

describe('Model', () => {

  before(done => sync().then(done).catch(done))

  beforeEach(done => Promise.all([
    User.truncate(),
    Repository.truncate()
  ]).
  then(() => done()).catch(done))

  describe('User', () => {
    it('should return the "json" property as an object', async (done) => {
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
    it('should return the "json" property as an object', async (done) => {
      const repoJson = reposJson[0]
      const repoId = repoJson.id
      const userId = userJson.id

      try {
        await User.create({id: userId, json: userJson})
        await Repository.create({id: repoId, userId, json: repoJson})
        const repo = await Repository.findById(repoId)

        expect(repo.get('json')).to.be.an('object')
        expect(repo.get('json')).to.have.property('id', repoId)
        expect(repo.get('json')).to.have.property('name').which.is.a('string')

        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
