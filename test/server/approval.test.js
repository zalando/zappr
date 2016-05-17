import sinon from 'sinon'
import { expect } from 'chai'
import { formatDate } from '../../common/debug'
import Approval from '../../server/checks/Approval'

const DEFAULT_REPO = {
  name: 'hello-world',
  full_name: 'mfellner/hello-world',
  owner: {
    login: 'mfellner'
  }
}
const TOKEN = 'abcd'
const DB_REPO_ID = 341
const ISSUE_PAYLOAD = {
  action: 'create',
  repository: DEFAULT_REPO,
  issue: {
    number: 2
  },
  comment: {}
}
const CLOSED_PR = {
  number: 3,
  state: 'closed'
}
const PR_PAYLOAD = {
  action: 'synchronize',
  number: 1,
  repository: DEFAULT_REPO,
  pull_request: {
    number: 1,
    updated_at: '2016-03-02T13:37:00Z',
    state: 'open',
    user: {login: 'stranger'},
    head: {
      sha: 'abcd1234'
    }
  }
}
const DEFAULT_CONFIG = {
  approvals: {
    minimum: 2,
    pattern: '^:\\+1:$'
  }
}
const SUCCESS_STATUS = Approval.generateStatus({total: 2}, DEFAULT_CONFIG.approvals)
const PENDING_STATUS = {
  state: 'pending',
  description: 'Approval validation in progress.',
  context: 'zappr'
}
const ZERO_APPROVALS_STATUS = Approval.generateStatus({total: 0}, DEFAULT_CONFIG.approvals)
const DB_PR = {
  last_push: new Date(),
  number: 3
}

describe('Approval#countApprovals', () => {
  it('should honor the provided pattern', async(done) => {
    const comments = [{
      user: {login: 'prayerslayer'},
      body: 'awesome :+1:' // does not count
    }, {
      user: {login: 'mfellner'},
      body: ':+1:' // counts
    }, {
      user: {login: 'mfellner'},
      body: ':+1:' // is ignored because mfellner already approved
    }]
    try {
      const approvals = await Approval.countApprovals(null, DEFAULT_REPO, comments, DEFAULT_CONFIG.approvals, null)
      expect(approvals).to.deep.equal({total: 1})
      done()
    } catch (e) {
      done(e)
    }
  })
})

describe('Approval#getApprovalsForConfig', () => {
  var github

  beforeEach(() => {
    github = {
      isMemberOfOrg: () => {
      },
      isCollaborator: () => {
      }
    }
  })

  it('should sum the total correctly', async(done) => {
    try {
      let comments = [{
        body: 'awesome',
        user: {login: 'user1'}
      }, {
        body: 'awesome',
        user: {login: 'user2'}
      }, {
        body: 'lolz',
        user: {login: 'user3'}
      }]
      let approvals = await Approval.getApprovalsForConfig(github, DEFAULT_REPO, comments, DEFAULT_CONFIG.approvals, TOKEN)
      expect(approvals.total).to.equal(3)
      // and with empty comments
      comments = []
      approvals = await Approval.getApprovalsForConfig(github, DEFAULT_REPO, comments, DEFAULT_CONFIG.approvals, TOKEN)
      expect(approvals.total).to.equal(0)
      done()
    } catch (e) {
      done(e)
    }
  })
  it('should honor from configuration', async(done) => {
    try {
      const comments = [{
        body: 'awesome',
        user: {login: 'user1'}
      }, {
        body: 'awesome',
        user: {login: 'user2'}
      }, {
        body: 'lolz',
        user: {login: 'user3'}
      }]
      sinon.stub(github, 'isMemberOfOrg', (org, user) => user === 'user3')
      const config = Object.assign({}, DEFAULT_CONFIG.approvals, {from: {orgs: ['zalando']}})
      const approvals = await Approval.getApprovalsForConfig(github, DEFAULT_REPO, comments, config, TOKEN)
      expect(github.isMemberOfOrg.callCount).to.equal(3)
      expect(approvals.total).to.equal(1)
      done()
    } catch (e) {
      done(e)
    }
  })
  it('should contain group information', async(done) => {
    try {
      const comments = [{
        body: 'awesome',
        user: {login: 'user1'}
      }, {
        body: 'awesome',
        user: {login: 'user2'}
      }, {
        body: 'lolz',
        user: {login: 'user3'}
      }]
      github.isMemberOfOrg = sinon.stub().returns(true)
      const config = Object.assign({}, DEFAULT_CONFIG.approvals, {
          groups: {
            zalando: {
              minimum: 2,
              from: {
                orgs: ['zalando']
              }
            }
          }
        }
      )
      const approvals = await Approval.getApprovalsForConfig(github, DEFAULT_REPO, comments, config, TOKEN)
      expect(github.isMemberOfOrg.callCount).to.equal(3)
      expect(approvals.total).to.equal(3)
      expect(approvals.groups.zalando).to.be.defined
      expect(approvals.groups.zalando).to.equal(3)
      done()
    }
    catch
      (e) {
      done(e)
    }
  })
})

describe('Approval#execute', () => {
  var github
  var pullRequestHandler
  var approval


  beforeEach(() => {
    pullRequestHandler = {
      onGet: sinon.stub().returns(DB_PR),
      onAddCommit: sinon.spy(),
      onCreatePullRequest: sinon.spy()
    }
    approval = Approval
    github = {
      isMemberOfOrg: sinon.spy(),
      isCollaborator: sinon.spy(),
      setCommitStatus: sinon.spy(),
      getApprovals: sinon.spy(),
      getPullRequest: sinon.spy(),
      getComments: sinon.spy(),
      fetchPullRequestCommits: sinon.spy()
    }
  })

  it('should be callable', () => {
    const result = github.setCommitStatus(1, 2, 3, 4)
    expect(result).to.be.undefined
    expect(github.setCommitStatus.calledWith(1, 2, 3, 4)).to.be.true
  })

  it('should set status to success on last issue comment', async (done) => {
    github.fetchPullRequestCommits = sinon.stub().returns([{
      committer: {
        login: "stranger"
      }
    }])
    github.getComments = sinon.stub().returns([{
      body: ':+1:',
      user: {login: 'foo'}
    }, {
      body: ':+1:',
      user: {login: 'bar'}
    }, {
      body: ':+1:',
      user: {login: 'bar'}
    }, {
      body: ':+1:',
      user: {login: 'stranger'}
    }])
    github.getPullRequest = sinon.stub().returns(PR_PAYLOAD.pull_request)
    try {
      await approval.execute(github, DEFAULT_CONFIG, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)

      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      expect(github.fetchPullRequestCommits.callCount).to.equal(1)
      expect(github.getPullRequest.callCount).to.equal(1)
      expect(github.isMemberOfOrg.callCount).to.equal(0)

      const successStatusCallArgs = github.setCommitStatus.args[1]
      const commentCallArgs = github.getComments.args[0]
      const prCallArgs = github.getPullRequest.args[0]
      const prCommitsCallArgs = github.fetchPullRequestCommits.args[0]

      expect(prCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        2,
        TOKEN
      ])
      expect(commentCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        2,
        formatDate(DB_PR.last_push),
        TOKEN
      ])
      expect(successStatusCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        'abcd1234',
        SUCCESS_STATUS,
        TOKEN
      ])
      expect(prCommitsCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        2,
        TOKEN
      ])
      done()
    } catch(e) {
      done(e)
    }
  })

  it('should do nothing on comment on non-open pull_request', async (done) => {
    github.getPullRequest = sinon.stub().returns(CLOSED_PR)
    await Approval.execute(github, DEFAULT_CONFIG, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)
    expect(github.setCommitStatus.callCount).to.equal(0)
    expect(github.getApprovals.callCount).to.equal(0)
    done()
  })

  it('should set status to pending on PR:opened', async (done) => {
    PR_PAYLOAD.action = 'opened'
    try {
      await Approval.execute(github, DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)
      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(0)
      const pendingCallArgs = github.setCommitStatus.args[0]
      const missingApprovalsCallArgs = github.setCommitStatus.args[1]

      expect(pendingCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        PR_PAYLOAD.pull_request.head.sha,
        PENDING_STATUS,
        TOKEN
      ])
      expect(missingApprovalsCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        PR_PAYLOAD.pull_request.head.sha,
        ZERO_APPROVALS_STATUS,
        TOKEN
      ])
      done()
    } catch(e) {
      done(e)
    }
  })

  it('should set status to success on PR:reopened with all approvals', async (done) => {
    try {
      PR_PAYLOAD.action = 'reopened'
      github.fetchPullRequestCommits = sinon.stub().returns([])
      github.getComments = sinon.stub().returns([])
      approval.countApprovals = sinon.stub().returns({total: 4})
      await approval.execute(github, DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)
      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      const pendingCallArgs = github.setCommitStatus.args[0]
      const successCallArgs = github.setCommitStatus.args[1]


      expect(pendingCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        PR_PAYLOAD.pull_request.head.sha,
        PENDING_STATUS,
        TOKEN
      ])
      expect(successCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        PR_PAYLOAD.pull_request.head.sha,
        Approval.generateStatus({total: 4}, {minimum: 2}),
        TOKEN
      ])
      done()
    } catch(e) {
      done(e)
    }
  })

  it('should set status to pending on PR:synchronize', async (done) => {
    PR_PAYLOAD.action = 'synchronize'
    await Approval.execute(github, DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)
    expect(github.setCommitStatus.callCount).to.equal(1)
    expect(github.setCommitStatus.args[0]).to.deep.equal([
      'mfellner',
      'hello-world',
      PR_PAYLOAD.pull_request.head.sha,
      ZERO_APPROVALS_STATUS,
      TOKEN
    ])
    done()
  })
})
