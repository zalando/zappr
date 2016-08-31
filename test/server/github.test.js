import sinon from 'sinon'
import nconf from '../../server/nconf'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'
import { toGenericComment } from '../../common/util'

describe('The Github service', () => {
  let github
  const MOCK_COMMENTS = [
    {created_at: '2016-07-11T15:00:00Z', user: {login: 'foo'}},
    {created_at: '2016-07-11T17:00:00Z', user: {login: 'bar'}}
  ]

  beforeEach(() => {
    github = new GithubService()
    github.fetchPath = sinon.stub()
  })

  describe('#setCommitStatus', () => {
    const lengths = [130, 140, 150]
    const maxLength = 140
    lengths.forEach(length => {
      it(`should ${length <= maxLength ? 'not ' : ''}truncate the description (${length} characters)`, async(done) => {
        github.fetchPath.returns({})
        const owner = 'zalando'
        const repo = 'zappr'
        const sha = 'ab123'
        const token = 'token'
        const statusToSend = {
          description: '#'.repeat(length),
          state: 'success',
          context: 'zappr/test'
        }
        const substitute = '...'
        const expectedSentStatus = {
          description: length <= maxLength ?
            '#'.repeat(length) :
            ('#'.repeat(maxLength - substitute.length) + substitute),
          state: 'success',
          context: 'zappr/test'
        }
        await github.setCommitStatus(owner, repo, sha, statusToSend, token)
        try {
          expect(github.fetchPath.calledWithExactly('POST', `/repos/${owner}/${repo}/statuses/${sha}`,
            expectedSentStatus,
            token)).to.be.true
          expect(expectedSentStatus.description.length).to.be.at.most(maxLength)
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  describe('#getComments', () => {
    it('should include only comments created after `since`', async(done) => {
      try {
        github.fetchPath.returns(MOCK_COMMENTS)
        const comments = await github.getComments('zalando', 'zappr', 348, '2016-07-11T16:00:00Z', 'token')
        expect(comments.length).to.equal(1)
        expect(comments[0]).to.deep.equal(toGenericComment(MOCK_COMMENTS[1]))
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
        expect(comments).to.deep.equal(MOCK_COMMENTS.map(toGenericComment))
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe('#readPullRequestTemplate', () => {
    it(`should load first template content if it is available`, async(done) => {
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

    it(`should reject if no templates are available`, async(done) => {
      try {
        github.fetchPath.returns(Promise.reject())
        await github.readPullRequestTemplate('user', 'repo', 'token')
      } catch (e) {
        done(e)
      }
    })
  })

  describe('#proposeZapprFile', () => {
    it('should call the correct functions', async(done) => {
      try {
        github.getBranch = sinon.stub().returns({commit: {sha: 'sha'}})
        github.createBranch = sinon.spy()
        github.createFile = sinon.spy()
        github.createPullRequest = sinon.spy()

        const USER = 'user'
        const REPO = 'repo'
        const BASE = 'base'
        const TOKEN = 'token'
        const WELCOME_BRANCH = 'welcome-to-zappr'

        await github.proposeZapprfile(USER, REPO, BASE, TOKEN)
        expect(github.getBranch.calledOnce).to.be.true
        expect(github.createBranch.calledOnce).to.be.true
        expect(github.createFile.calledOnce).to.be.true
        expect(github.createPullRequest.calledOnce).to.be.true

        expect(github.createPullRequest.calledWith(
          USER,
          REPO,
          WELCOME_BRANCH,
          BASE,
          nconf.get('ZAPPR_WELCOME_TITLE'),
          nconf.get('ZAPPR_WELCOME_TEXT'),
          TOKEN
        )).to.be.true

        expect(github.createFile.calledWith(
          USER,
          REPO,
          WELCOME_BRANCH,
          nconf.get('VALID_ZAPPR_FILE_PATHS')[0],
          nconf.get('ZAPPR_AUTOCREATED_CONFIG'),
          TOKEN)).to.be.true

        expect(github.createBranch.calledWith(
          USER,
          REPO,
          WELCOME_BRANCH,
          'sha',
          TOKEN
        )).to.be.true

        expect(github.getBranch.calledWith(USER, REPO, BASE, TOKEN)).to.be.true

        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
