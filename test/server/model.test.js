import { expect } from 'chai'
import Approval from '../../server/checks/Approval'
import { db, User, Repository, UserRepository, Check, Session } from '../../server/model'

const users = {
  a: {
    data: require('../fixtures/github.user.a.json'),
    repos: require('../fixtures/github.user.a.repos.json')
  },
  b: {
    data: require('../fixtures/github.user.b.json'),
    repos: require('../fixtures/github.user.b.repos.json')
  }
}

describe('Model', () => {

  before(done => db.createSchemas().then(db._sync).then(() => done()).catch(done))

  beforeEach(done => Promise.all([
    User.truncate({cascade: true}),
    Repository.truncate({cascade: true}),
    UserRepository.truncate({cascade: true})
  ]).then(() => done()).catch(done))

  describe('User', () => {
    it('should return the "json" property as an object', async(done) => {
      const user = users.a.data
      const userId = user.id

      try {
        await User.create({
          id: userId,
          json: user
        })
        const savedUser = await User.findById(userId)

        expect(savedUser.get({plain: true})).to.be.an('object')
                                            .and.contain.all.keys(
          'id',
          'json',
          'access_level'
        )
        expect(savedUser.get('access_level')).to.be.a('string')
                                             .and.equal('minimal')
        expect(savedUser.get('json')).to.be.an('object')
                                     .and.deep.equal(user)

        done()
      } catch (e) {
        done(e)
      }
    })

    it('should support multiple users', async(done) => {
      const userA = users.a.data
      const userAId = userA.id
      const userB = users.b.data
      const userBId = userB.id

      try {
        await User.bulkCreate([
          {id: userAId, json: userA},
          {id: userBId, json: userB}
        ])

        const savedUserA = await User.findById(userAId)
        const savedUserB = await User.findById(userBId)

        expect(savedUserA.get('json')).to.deep.equal(userA)
        expect(savedUserB.get('json')).to.deep.equal(userB)

        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('Repository', () => {
    it('should return the "json" property as an object', async(done) => {
      const user = users.a.data
      const userId = user.id
      const repo = users.a.repos[0]
      const repoId = repo.id

      try {
        await User.create({id: userId, json: user})
        await Repository.create({id: repoId, json: repo})
        await UserRepository.create({userId, repositoryId: repoId})

        const savedRepo = await Repository.userScope(user).findById(repoId)
        const repoUsers = await savedRepo.getUsers()

        expect(savedRepo.get('json')).to.be.an('object')
        expect(savedRepo.get('json')).to.deep.equal(repo)
        expect(repoUsers.length).to.equal(1)
        expect(repoUsers.map(user => user.get('json'))).to.contain.deep(user)

        done()
      } catch (e) {
        done(e)
      }
    })

    it('should support shared repositories by different users', async(done) => {
      const userA = users.a.data
      const userAId = userA.id
      const userB = users.b.data
      const userBId = userB.id
      const reposA = users.a.repos
      const reposB = users.b.repos

      try {
        const sharedRepos = reposA.filter(repoA => reposB.findIndex(repoB => repoA.id === repoB.id) !== -1)

        expect(sharedRepos.length).to.be.above(1)

        await User.bulkCreate([
          {id: userAId, json: userA},
          {id: userBId, json: userB}
        ])

        await Repository.bulkCreate(reposA.map(repo => ({
          id: repo.id, json: repo
        })))

        await UserRepository.bulkCreate(reposA.map(repo => ({
          userId: userAId, repositoryId: repo.id
        })))

        await db.transaction(t =>
          Promise.all(
            reposB.map(async(repoB) => {
              const [repo] = await Repository.findOrCreate({
                where: {id: repoB.id},
                defaults: {
                  id: repoB.id,
                  json: repoB
                },
                transaction: t
              })
              // HACK: workaround for https://github.com/sequelize/sequelize/issues/3220
              await UserRepository.findOrCreate({
                where: {
                  userId: userB.id,
                  repositoryId: repo.id
                },
                defaults: {
                  userId: userB.id,
                  repositoryId: repo.id
                },
                transaction: t
              })
            })
          )
        )

        const sharedRepoIds = sharedRepos.map(repo => repo.id)
        const sharedSavedRepos = await Repository.findAll({where: {id: {in: sharedRepoIds}}})

        expect(sharedSavedRepos.length).to.equal(sharedRepos.length)

        sharedSavedRepos.forEach(sharedSavedRepo => {
          const json = sharedSavedRepo.get('json')
          const repo = sharedRepos.find(r => r.id === sharedSavedRepo.id)
          expect(json).to.deep.equal(repo)
        })

        await Promise.all(
          sharedSavedRepos.map(async(sharedSavedRepo) => {
            const users = await sharedSavedRepo.getUsers()
            const userIds = users.map(user => user.id)
            expect(userIds).to.include(userA.id)
            expect(userIds).to.include(userB.id)
          })
        )

        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('Session', () => {
    before((done) => {
      Session.truncate({cascade: true})
      done()
    })
    it('should store the encrypted token and return the decrypted token', async(done) => {
      const json = {
        passport: {
          user: {
            accessToken: 'abcd'
          }
        }
      }
      const id = 'foo'
      try {
        await Session.create({id, json})
        const dbSession = await Session.findById(id, {raw: true})
        expect(dbSession.json.passport.user.accessToken).to.be.a('string')
                                                        .and.equal('::dcba')
        const appSession = await Session.findById(id)
        expect(appSession.json.passport.user.accessToken).to.be.a('string')
                                                         .and.equal('abcd')
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('Check', () => {
    it('should store the encrypted token and return the decrypted token', async(done) => {
      const repo = users.a.repos[0]
      const repoId = repo.id
      const user = users.a.data
      const userId = user.id
      const userLogin = user.login
      const checkId = 42
      const token = 'abcd'

      try {
        await User.create({id: userId, json: user})
        await Repository.create({id: repoId, userId, json: repo})
        await Check.create({
          id: checkId,
          token,
          repositoryId: repoId,
          type: Approval.TYPE,
          created_by: userLogin
        })
        const savedCheck = await Check.findById(checkId)
        expect(savedCheck.get({plain: true})).to.be.an('object')
                                             .and.contain.all.keys(
          // fields we added
          'id',
          'token',
          'created_by',
          'type',
          // fields added by sequelize
          'repositoryId',
          'createdAt',
          'updatedAt')
        expect(savedCheck.get('created_by')).to.equal(userLogin)
        expect(savedCheck.get('token')).to.equal(token)
        const dbCheck = await Check.findById(checkId, {raw: true})
        expect(dbCheck.token).to.be.a('string')
                             .and.equal('::dcba')
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
