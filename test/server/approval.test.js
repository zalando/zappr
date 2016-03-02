import sinon from 'sinon'
import { expect } from 'chai'
import Approval from '../../server/checks/Approval'
import Github from '../../server/service/GithubService'

describe('Approval#execute', () => {
  var github
  var pullRequestHandler

  const DEFAULT_REPO = {
    name: 'hello-world',
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
      head: {
        sha: 'abcd1234'
      }
    }
  }
  const DEFAULT_CONFIG = {
    approvals: {
      minimum: 2,
      pattern: 'awesome'
    }
  }
  const SUCCESS_STATUS = {
    state: 'success',
    description: Approval.generateStatusMessage(2, DEFAULT_CONFIG.approvals.minimum),
    context: 'zappr'
  }
  const PENDING_STATUS = {
    state: 'pending',
    description: 'ZAPPR validation in progress.',
    context: 'zappr'
  }
  const ZERO_APPROVALS_STATUS = {
    state: 'failure',
    context: 'zappr',
    description: Approval.generateStatusMessage(0, DEFAULT_CONFIG.approvals.minimum)
  }

  beforeEach(() => {
    pullRequestHandler = {
      onGet: sinon.stub().returns({ last_push: new Date(), number: 3}),
      onAddCommit: sinon.spy(),
      onCreatePullRequest: sinon.spy()
    }
    github = {
      formatDate: sinon.stub().returns('2016-03-04T13:54:00Z'),
      setCommitStatus: sinon.spy(),
      getApprovals: sinon.spy(),
      getPullRequest: sinon.spy(),
      getComments: sinon.spy()
    }
  })

  it('should be callable', () => {
    const result = github.setCommitStatus(1, 2, 3, 4)
    expect(result).to.be.undefined
    expect(github.setCommitStatus.calledWith(1, 2, 3, 4)).to.be.true
  })

  it('should set status to success on last issue comment', async (done) => {
    github = new Github()
    github.setCommitStatus = sinon.spy()
    github.getComments = sinon.stub().returns([{
      body: 'awesome',
      user: { login: 'foo'}
    }, {
      body: 'awesome',
      user: { login: 'bar'}
    }])
    github.getPullRequest = sinon.stub().returns(PR_PAYLOAD.pull_request)
    try {
      await Approval.execute(github, DEFAULT_CONFIG, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)

      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      expect(github.getPullRequest.callCount).to.equal(1)

      const successStatusCallArgs = github.setCommitStatus.args[1]
      const commentCallArgs = github.getComments.args[0]
      const prCallArgs = github.getPullRequest.args[0]

      expect(prCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        2,
        TOKEN
      ])
      expect(commentCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        1,
        PR_PAYLOAD.pull_request.updated_at,
        TOKEN
      ])
      expect(successStatusCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        'abcd1234',
        SUCCESS_STATUS,
        TOKEN
      ])
      done()
    }
    catch(e) {
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

  it('should set status to failure on PR:opened', async (done) => {
    PR_PAYLOAD.action = 'opened'
    github.getApprovals = sinon.stub().returns(0)
    await Approval.execute(github, DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)
    expect(github.setCommitStatus.callCount).to.equal(2)
    expect(github.getApprovals.callCount).to.equal(1)
    const pendingCallArgs = github.setCommitStatus.args[0]
    const failureCallArgs = github.setCommitStatus.args[1]

    try {
      expect(pendingCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        PR_PAYLOAD.pull_request.head.sha,
        PENDING_STATUS,
        TOKEN
      ])
      expect(failureCallArgs).to.deep.equal([
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
    PR_PAYLOAD.action = 'reopened'
    github.getApprovals = sinon.stub().returns(4)
    await Approval.execute(github, DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)
    expect(github.setCommitStatus.callCount).to.equal(2)
    expect(github.getApprovals.callCount).to.equal(1)
    const pendingCallArgs = github.setCommitStatus.args[0]
    const successCallArgs = github.setCommitStatus.args[1]

    try {
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
        {
          state: 'success',
          description: Approval.generateStatusMessage(4, 2),
          context: 'zappr'
        },
        TOKEN
      ])
      done()
    } catch(e) {
      done(e)
    }
  })

  it('should set status to failure on PR:synchronize', async (done) => {
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
