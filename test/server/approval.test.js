import sinon from 'sinon'
import { expect } from 'chai'
import { formatDate } from '../../common/debug'
import Approval from '../../server/checks/Approval'

describe('Approval#countApprovals', () => {
  const DEFAULT_REPO = {
    name: 'hello-world',
    full_name: 'mfellner/hello-world',
    owner: {
      login: 'mfellner'
    }
  }

  it('should honor the provided pattern', async (done) => {
    const comments = [{
      user: { login: 'prayerslayer' },
      body: 'awesome :+1:' // does not count
    }, {
      user: { login: 'mfellner' },
      body: ':+1:' // counts
    }, {
      user: { login: 'mfellner' },
      body: ':+1:' // is ignored because mfellner already approved
    }]
    try {
      const approvals = await Approval.countApprovals(null, DEFAULT_REPO, comments, {pattern: '^:\\+1:$'}, null)
      expect(approvals).to.equal(1)
      done()
    } catch(e) {
      done(e)
    }
  })
})

describe('Approval#execute', () => {
  var github
  var pullRequestHandler
  var approval

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
      user: { login: 'stranger'},
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
    description: 'Approval validation in progress.',
    context: 'zappr'
  }
  const ZERO_APPROVALS_STATUS = {
    state: 'pending',
    context: 'zappr',
    description: Approval.generateStatusMessage(0, DEFAULT_CONFIG.approvals.minimum)
  }
  const DB_PR = {
    last_push: new Date(),
    number: 3
  }

  beforeEach(() => {
    pullRequestHandler = {
      onGet: sinon.stub().returns(DB_PR),
      onAddCommit: sinon.spy(),
      onCreatePullRequest: sinon.spy()
    }
    approval = Approval
    github = {
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
    github.setCommitStatus = sinon.spy()
    github.getComments = sinon.stub().returns([{
      body: 'awesome',
      user: { login: 'foo'}
    }, {
      body: 'awesome',
      user: { login: 'bar'}
    }, {
      body: 'awesome',
      user: { login: 'bar'}
    }, {
      body: 'awesome',
      user: { login: 'stranger' }
    }])
    github.getPullRequest = sinon.stub().returns(PR_PAYLOAD.pull_request)
    try {
      await approval.execute(github, DEFAULT_CONFIG, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)

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
    PR_PAYLOAD.action = 'reopened'
    github.getComments = sinon.stub().returns(Promise.resolve([]))
    approval.countApprovals = sinon.stub().returns(Promise.resolve(4))
    await approval.execute(github, DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID, pullRequestHandler)
    expect(github.setCommitStatus.callCount).to.equal(2)
    expect(github.getComments.callCount).to.equal(1)
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
