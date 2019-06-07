import sinon from 'sinon'
import nconf from '../../server/nconf'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'
import { toGenericComment } from '../../common/util'
import { GithubBranchProtectedError } from '../../server/service/GithubServiceError'

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

  describe('branch protection calls contain special Accept header', () => {
    const USER = 'user'
    const REPO = 'repo'
    const BRANCH = 'master'
    const CHECK = 'check'
    const TOKEN = 'token'
    const HEADER = {Accept: 'application/vnd.github.loki-preview+json'}

    beforeEach(() => {
      github.fetchPath = sinon.stub().returns({})
    })
    it('getRequiredStatusChecks', async(done) => {
      try {
        await github.getRequiredStatusChecks(USER, REPO, BRANCH, TOKEN)
        expect(github.fetchPath.args).to.deep.equal([
          ['GET', `/repos/${USER}/${REPO}/branches/${BRANCH}/protection/required_status_checks`,
            null,
            TOKEN,
            HEADER]
        ])
        done()
      } catch (e) {
        done(e)
      }
    })

    it('removeRequiredStatusCheck removes branch protection ', async(done) => {
      try {
        github.fetchPath = sinon.stub().returns({contexts: [CHECK, 'foo']})
        await github.removeRequiredStatusCheck(USER, REPO, BRANCH, CHECK, TOKEN)
        expect(github.fetchPath.args).to.deep.equal([
          ['GET', `/repos/${USER}/${REPO}/branches/${BRANCH}/protection/required_status_checks`,
            null,
            TOKEN,
            HEADER],
          ['PATCH', `/repos/${USER}/${REPO}/branches/${BRANCH}/protection/required_status_checks`,
            {
              include_admins: true,
              contexts: ['foo']
            },
            TOKEN,
            HEADER]
        ])
        done()
      } catch (e) {
        done(e)
      }
    })

    it('removeRequiredStatusCheck returns 403 when changing Branch Protection Settings is Disabled', async(done) => {
        //GIVEN
        const errorConfig = {
          statusCode: 403,
          body: {
            message: 'Branch protected'
          },
          request: {
            uri: {
              href: `/repos/${USER}/${REPO}/branches/${BRANCH}/protection/required_status_checks`,
            },
            method: 'PATCH'
          }
        };
        const errorObject = new GithubBranchProtectedError(errorConfig)
        github.fetchPath = sinon.stub().throws(errorObject);
      try {
        //WHEN
        github.removeRequiredStatusCheck(USER, REPO, BRANCH, CHECK, TOKEN)
          .catch(e => {
            expect(e.detail).to.equal(errorObject.detail);
            done()
          })
      } catch (e) {
        //THEN
        done(e)
      }
    })

    it('addRequiredStatusCheck', async(done) => {
      try {
        github.fetchPath = sinon.stub().returns({contexts: ['foo']})
        await github.addRequiredStatusCheck(USER, REPO, BRANCH, CHECK, TOKEN)
        expect(github.fetchPath.args).to.deep.equal([
          ['GET', `/repos/${USER}/${REPO}/branches/${BRANCH}/protection/required_status_checks`,
            null,
            TOKEN,
            HEADER],
          ['PATCH', `/repos/${USER}/${REPO}/branches/${BRANCH}/protection/required_status_checks`,
            {
              include_admins: true,
              contexts: ['foo', CHECK]
            },
            TOKEN,
            HEADER]
        ])
        done()
      } catch (e) {
        done(e)
      }
    })

    it('isBranchProtected', async(done) => {
      try {
        await github.isBranchProtected(USER, REPO, BRANCH, TOKEN)
        expect(github.fetchPath.args).to.deep.equal([
          ['GET', `/repos/${USER}/${REPO}/branches/${BRANCH}`,
            null,
            TOKEN,
            HEADER]
        ])
        done()
      } catch (e) {
        done(e)
      }
    })

    it('protectBranch', async(done) => {
      try {
        await github.protectBranch(USER, REPO, BRANCH, CHECK, TOKEN)
        expect(github.fetchPath.args).to.deep.equal([
          ['GET', `/repos/${USER}/${REPO}/branches/${BRANCH}`,
            null,
            TOKEN,
            HEADER],
          ['PUT', `/repos/${USER}/${REPO}/branches/${BRANCH}/protection`,
            {
              required_status_checks: {
                include_admins: true,
                strict: false,
                contexts: [CHECK]
              },
              required_pull_request_reviews: null,
              restrictions: null,
              enforce_admins: true
            },
            TOKEN,
            HEADER]
        ])
        done()
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

        await github.proposeZapprfile(USER, REPO, BASE, TOKEN)
        expect(github.getBranch.calledOnce).to.be.true
        expect(github.createBranch.calledOnce).to.be.true
        expect(github.createFile.calledOnce).to.be.true
        expect(github.createPullRequest.calledOnce).to.be.true

        expect(github.createPullRequest.calledWith(
          USER,
          REPO,
          nconf.get('ZAPPR_WELCOME_BRANCH_NAME'),
          BASE,
          nconf.get('ZAPPR_WELCOME_TITLE'),
          nconf.get('ZAPPR_WELCOME_TEXT'),
          TOKEN
        )).to.be.true

        expect(github.createFile.calledWith(
          USER,
          REPO,
          nconf.get('ZAPPR_WELCOME_BRANCH_NAME'),
          nconf.get('VALID_ZAPPR_FILE_PATHS')[0],
          nconf.get('ZAPPR_AUTOCREATED_CONFIG'),
          TOKEN)).to.be.true

        expect(github.createBranch.calledWith(
          USER,
          REPO,
          nconf.get('ZAPPR_WELCOME_BRANCH_NAME'),
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

  describe('#updateWebhookFor', () => {
    it('should build webhook url from host address', async(done) => {
      try {
        const USER = 'user'
        const REPO = 'repo'
        const TOKEN = 'token'

        github.fetchPath.returns([])
        nconf.set('HOOK_URL', null)

        await github.updateWebhookFor(USER, REPO, [], TOKEN)    
        expect(github.fetchPath.args).to.deep.equal([
          ['GET', `/repos/${USER}/${REPO}/hooks`,
            null,
            TOKEN],
          ['POST', `/repos/${USER}/${REPO}/hooks`,
            {
              name: 'web',
              active: true,
              events: [],
              config: {
                url: nconf.get('HOST_ADDR') + '/api/hook',
                content_type: 'json',
                secret: nconf.get('GITHUB_HOOK_SECRET')
              }
            },
            TOKEN]
        ])

        done()
      } catch (e) {
        done(e)
      }
    })

    it('should use provided webhook url', async(done) => {
      try {
        const USER = 'user'
        const REPO = 'repo'
        const TOKEN = 'token'
        const HOOK_URL = 'hookurl'

        github.fetchPath.returns([])
        nconf.set('HOOK_URL', HOOK_URL)

        await github.updateWebhookFor(USER, REPO, [], TOKEN)
        expect(github.fetchPath.args).to.deep.equal([
          ['GET', `/repos/${USER}/${REPO}/hooks`,
            null,
            TOKEN],
          ['POST', `/repos/${USER}/${REPO}/hooks`,
            {
              name: 'web',
              active: true,
              events: [],
              config: {
                url: HOOK_URL,
                content_type: 'json',
                secret: nconf.get('GITHUB_HOOK_SECRET')
              }
            },
            TOKEN]
        ])

        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
