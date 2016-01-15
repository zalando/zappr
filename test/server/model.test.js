import { sync, User, Repository } from '../../server/model'

import { logger } from '../../common/debug'
const log = logger('test')

const reposJson = require('../fixtures/github.user.repos.json')
const userJson = require('../fixtures/github.user.json')

describe('Model', () => {

  before(done => sync().then(done).catch(done))

  describe('Repository', () => {
    it('should ...', async (done) => {
      const repoJson = reposJson[0]
      const repoId = repoJson.id
      const userId = userJson.id

      try {
        await User.truncate()
        await Repository.truncate()
        await User.create({id: userId, json: userJson})
        await Repository.create({id: repoId, userId, json: repoJson})
        const repo = await Repository.findById(32830023)
        if (typeof repo.get('json').name !== 'string') done(new Error())
      } catch (e) {
        done(e)
      }
      done()
    })
  })
})
