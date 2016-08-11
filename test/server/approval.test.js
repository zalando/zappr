import sinon from 'sinon'
import { expect } from 'chai'
import { formatDate } from '../../common/debug'
import Approval from '../../server/checks/Approval'
import AuditService from '../../server/service/audit/AuditService'

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
    ignore: 'none',
    pattern: '^:\\+1:$',
    veto: {
      pattern: '^:\\-1:$',
    }
  }
}
const SUCCESS_STATUS = Approval.generateStatus({approvals: {total: ['foo', 'bar']}, vetos: []}, DEFAULT_CONFIG.approvals)
const BLOCKED_BY_VETO_STATUS = Approval.generateStatus({approvals: {total: ['foo', 'bar']}, vetos: ['mr-foo']}, DEFAULT_CONFIG.approvals)
const PENDING_STATUS = {
  state: 'pending',
  description: 'Approval validation in progress.',
  context: 'zappr'
}
const ZERO_APPROVALS_STATUS = Approval.generateStatus({approvals: {total: []}, vetos: []}, DEFAULT_CONFIG.approvals)
const DB_PR = {
  last_push: new Date(),
  number: 3
}

describe('Approval#fetchIgnoredUsers', () => {
  let approval

  beforeEach(() => {
    approval = new Approval(null, null)
  })

  it('should not do anything if ignore is missing', async(done) => {
    try {
      const ignore = await approval.fetchIgnoredUsers(DEFAULT_REPO, PR_PAYLOAD.pull_request, {}, TOKEN)
      expect(ignore.length).to.equal(0)
      done()
    } catch (e) {
      done(e)
    }
  })
  it('should not do anything if ignore=none', async(done) => {
    try {
      const ignore = await approval.fetchIgnoredUsers(DEFAULT_REPO, PR_PAYLOAD.pull_request, {ignore: 'none'}, TOKEN)
      expect(ignore.length).to.equal(0)
      done()
    } catch (e) {
      done(e)
    }
  })
  it('should fetch last committer if ignore=last_committer', async(done) => {
    try {
      const lastCommitter = 'mark'
      const github = {
        fetchLastCommitter: sinon.stub().returns(lastCommitter)
      }
      const approval = new Approval(github, null)
      const ignore = await approval.fetchIgnoredUsers(DEFAULT_REPO, PR_PAYLOAD.pull_request, {ignore: 'last_committer'}, TOKEN)
      expect(ignore.length).to.equal(1)
      expect(ignore[0]).to.equal(lastCommitter)
      done()
    } catch (e) {
      done(e)
    }
  })
  it('should return pr opener if ignore=pr_opener', async(done) => {
    try {
      const prOpener = PR_PAYLOAD.pull_request.user.login
      const ignore = await approval.fetchIgnoredUsers(DEFAULT_REPO, PR_PAYLOAD.pull_request, {ignore: 'pr_opener'}, TOKEN)
      expect(ignore.length).to.equal(1)
      expect(ignore[0]).to.equal(prOpener)
      done()
    } catch (e) {
      done(e)
    }
  })
  it('should return both if ignore=both', async(done) => {
    try {
      const lastCommitter = 'mark'
      const prOpener = PR_PAYLOAD.pull_request.user.login
      const github = {
        fetchLastCommitter: sinon.stub().returns(lastCommitter)
      }
      const approval = new Approval(github, null)
      const ignore = await approval.fetchIgnoredUsers(DEFAULT_REPO, PR_PAYLOAD.pull_request, {ignore: 'both'}, TOKEN)
      expect(ignore.length).to.equal(2)
      expect(ignore[0]).to.equal(lastCommitter)
      expect(ignore[1]).to.equal(prOpener)
      done()
    } catch (e) {
      done(e)
    }
  })
})

describe('Approval#generateStatus', () => {
  it('should favor vetos over approvals', () => {
    const result = Approval.generateStatus({approvals: { total: ['mr-foo']}, vetos: ['mr-bar']}, {minimum: 1})
    expect(result.state).to.equal('failure')
  })
  it('should be successful without vetos', () => {
    const result = Approval.generateStatus({approvals: { total: ['mr-foo']}, vetos: []}, {minimum: 1})
    expect(result.state).to.equal('success')
  })
})

describe('Approval#countApprovalsAndVetos', () => {
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
      const approval = new Approval(null, null)
      const {approvals} = await approval.countApprovalsAndVetos(DEFAULT_REPO, {}, comments, DEFAULT_CONFIG.approvals)
      expect(approvals).to.deep.equal({total: ['mfellner']})
      done()
    } catch (e) {
      done(e)
    }
  })
})

describe('Approval#getCommentStatsForConfig', () => {
  let github, approval

  beforeEach(() => {
    github = {
      isMemberOfOrg: () => {
      },
      isCollaborator: () => {
      }
    }
    approval = new Approval(github, null)
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
      let approvals = await approval.getCommentStatsForConfig(DEFAULT_REPO, comments, DEFAULT_CONFIG.approvals, TOKEN)
      expect(approvals.total).to.deep.equal(['user1', 'user2', 'user3'])
      // and with empty comments
      comments = []
      approvals = await approval.getCommentStatsForConfig(DEFAULT_REPO, comments, DEFAULT_CONFIG.approvals, TOKEN)
      expect(approvals.total).to.deep.equal([])
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
      const approvals = await approval.getCommentStatsForConfig(DEFAULT_REPO, comments, config, TOKEN)
      expect(github.isMemberOfOrg.callCount).to.equal(3)
      expect(approvals.total).to.deep.equal(['user3'])
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
      const approvals = await approval.getCommentStatsForConfig(DEFAULT_REPO, comments, config, TOKEN)
      expect(github.isMemberOfOrg.callCount).to.equal(3)
      expect(approvals.total).to.deep.equal(['user1', 'user2', 'user3'])
      expect(approvals.groups.zalando).to.be.defined
      expect(approvals.groups.zalando).to.deep.equal(['user1', 'user2', 'user3'])
      done()
    }
    catch
      (e) {
      done(e)
    }
  })
})

describe('Approval#execute', () => {
  let github, pullRequestHandler, approval


  beforeEach(() => {
    pullRequestHandler = {
      onGet: sinon.stub().returns(DB_PR),
      onAddCommit: sinon.spy(),
      onCreatePullRequest: sinon.spy()
    }
    github = {
      isMemberOfOrg: sinon.spy(),
      isCollaborator: sinon.spy(),
      setCommitStatus: sinon.spy(),
      getApprovals: sinon.spy(),
      getPullRequest: sinon.spy(),
      getComments: sinon.spy(),
      fetchPullRequestCommits: sinon.spy()
    }
    approval = new Approval(github, pullRequestHandler, new AuditService())
  })

  it('should set status to failure on last issue comment when there is a veto comment', async(done) => {
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
      body: ':-1:',
      user: {login: 'mr-foo'}
    }])
    github.getPullRequest = sinon.stub().returns(PR_PAYLOAD.pull_request)
    try {
      await approval.execute(DEFAULT_CONFIG, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID)

      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      expect(github.getPullRequest.callCount).to.equal(1)
      expect(github.isMemberOfOrg.callCount).to.equal(0)

      const failureStatusCallArgs = github.setCommitStatus.args[1]
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
        formatDate(DB_PR.last_push),
        TOKEN
      ])
      expect(failureStatusCallArgs).to.deep.equal([
        'mfellner',
        'hello-world',
        'abcd1234',
        BLOCKED_BY_VETO_STATUS,
        TOKEN
      ])
      done()
    } catch (e) {
      done(e)
    }
  })

  it('should set status to success on last issue comment', async(done) => {
    github.getComments = sinon.stub().returns([{
      body: ':+1:',
      user: {login: 'foo'}
    }, {
      body: ':+1:',
      user: {login: 'bar'}
    }, {
      body: ':+1:',
      user: {login: 'bar'}
    }])
    github.getPullRequest = sinon.stub().returns(PR_PAYLOAD.pull_request)
    try {
      await approval.execute(DEFAULT_CONFIG, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID)

      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      expect(github.getPullRequest.callCount).to.equal(1)
      expect(github.isMemberOfOrg.callCount).to.equal(0)

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
    } catch (e) {
      done(e)
    }
  })

  it('should do nothing on comment on non-open pull_request', async(done) => {
    github.getPullRequest = sinon.stub().returns(CLOSED_PR)
    await approval.execute(DEFAULT_CONFIG, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID)
    expect(github.setCommitStatus.callCount).to.equal(0)
    expect(github.getApprovals.callCount).to.equal(0)
    done()
  })

  it('should set status to pending on PR:opened', async(done) => {
    PR_PAYLOAD.action = 'opened'
    try {
      await approval.execute(DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID)
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
    } catch (e) {
      done(e)
    }
  })

  it('should set status to success on PR:reopened with all approvals', async(done) => {
    try {
      PR_PAYLOAD.action = 'reopened'
      github.fetchPullRequestCommits = sinon.stub().returns([])
      github.getComments = sinon.stub().returns([])
      approval.countApprovalsAndVetos = sinon.stub().returns({approvals: {total: ['red', 'blue', 'green', 'yellow']}, vetos: []})
      await approval.execute(DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID)
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
        Approval.generateStatus({approvals: {total: ['red', 'blue', 'green', 'yellow']}, vetos: []}, {minimum: 2}),
        TOKEN
      ])
      done()
    } catch (e) {
      done(e)
    }
  })

  it('should set status to pending on PR:synchronize', async(done) => {
    PR_PAYLOAD.action = 'synchronize'
    await approval.execute(DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID)
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
