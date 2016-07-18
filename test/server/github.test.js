import sinon from 'sinon'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'

describe('The Github service', () => {
  let github
  const MOCK_COMMENTS = [
    {created_at: '2016-07-11T15:00:00Z'},
    {created_at: '2016-07-11T17:00:00Z'}
  ]

  beforeEach(() => {
    github = new GithubService()
    github.fetchPath = sinon.stub()
  })

  describe('#getComments', () => {
    it('should include only comments created after `since`', async(done) => {
      try {
        github.fetchPath.returns(MOCK_COMMENTS)
        const comments = await github.getComments('zalando', 'zappr', 348, '2016-07-11T16:00:00Z', 'token')
        expect(comments.length).to.equal(1)
        expect(comments[0]).to.equal(MOCK_COMMENTS[1])
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should not include comments created before `since` ', async(done) => {
      try {
        github.fetchPath.returns(MOCK_COMMENTS)
        const comments = await github.getComments('zalando', 'zappr', 348, '2016-07-15T12:00:00Z', 'token')
        expect(comments.length).to.equal(0)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('should include everything if since is not present', async(done) => {
      try {
        github.fetchPath.returns(MOCK_COMMENTS)
        const comments = await github.getComments('zalando', 'zappr', 348, null, 'token')
        expect(comments).to.equal(MOCK_COMMENTS)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('#readPullRequestTemplate', () => {
    it(`should load first template content if it is available`, async (done) => {
      try {
        github.fetchPath.returns(Promise.reject())
        github.fetchPath.withArgs('GET', '/repos/user/repo/contents/.github/PULL_REQUEST_TEMPLATE'
          , null, 'token').returns(Promise.resolve({
          name: '.github/PULL_REQUEST_TEMPLATE',
          content: 'SXNzdWUgIw==',
          encoding: 'base64'
        }))

        const template = await github.readPullRequestTemplate('user', 'repo', 'token')
        expect(template).to.equal('Issue #')
        done()
      } catch (e) {
        done(e)
      }
    })

    it(`should reject if no templates are available`, async (done) => {
      try {
        github.fetchPath.returns(Promise.reject())
        await github.readPullRequestTemplate('user', 'repo', 'token')
      } catch (e) {
        done(e)
      }
    })
  })
})
