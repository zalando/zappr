import sinon from 'sinon'
import { expect } from 'chai'
import { formatDate } from '../../common/debug'
import Approval from '../../server/checks/Approval'
import AuditService from '../../server/service/audit/AuditService'
import * as EVENTS from '../../server/model/GithubEvents'

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
  action: 'created',
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
const MALICIOUS_PAYLOAD = {
  action: 'edited', // or 'deleted'
  repository: DEFAULT_REPO,
  issue: {
    number: 1
  },
  changes: {
    body: {
      from: ':-1:'
    }
  },
  comment: {
    id: 1,
    body: ':+1:',
    created_at: '2016-08-15T13:03:28Z',
    user: {
      login: 'mfellner'
    }
  },
  sender: {
    login: 'prayerslayer'
  }
}
const REGULAR_ISSUE_PAYLOAD = {
  action: 'edited', // or 'deleted'
  repository: DEFAULT_REPO,
  issue: {
    number: 1
  },
  changes: {
    body: {
      from: ':-1:'
    }
  },
  comment: {
    id: 1,
    body: ':+1:',
    created_at: '2016-08-15T13:03:28Z',
    user: {
      login: 'prayerslayer'
    }
  },
  sender: {
    login: 'prayerslayer'
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
const SUCCESS_STATUS = Approval.generateStatus({
  approvals: {total: ['foo', 'bar']},
  vetos: []
}, DEFAULT_CONFIG.approvals)
const BLOCKED_BY_VETO_STATUS = Approval.generateStatus({
  approvals: {total: ['foo', 'bar']},
  vetos: ['mr-foo']
}, DEFAULT_CONFIG.approvals)
const PENDING_STATUS = {
  state: 'pending',
  description: 'Approval validation in progress.',
  context: 'zappr'
}
const ZERO_APPROVALS_STATUS = Approval.generateStatus({approvals: {total: []}, vetos: []}, DEFAULT_CONFIG.approvals)
const DB_PR = {
  last_push: new Date(),
  number: 3,
  id: 1415
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
    const result = Approval.generateStatus({approvals: {total: ['mr-foo']}, vetos: ['mr-bar']}, {minimum: 1})
    expect(result.state).to.equal('failure')
  })
  it('should be successful without vetos', () => {
    const result = Approval.generateStatus({approvals: {total: ['mr-foo']}, vetos: []}, {minimum: 1})
    expect(result.state).to.equal('success')
  })
})

describe('Approval#fetchCountApprovalsAndVetos', () => {
  const comments = [{
    id: 2,
    body: 'this loses'
  }, {
    id: 3,
    body: 'foo'
  }]
  const frozenComments = [{
    id: 1,
    body: 'bar'
  }, {
    id: 2,
    body: 'this wins'
  }]

  it('should properly merge frozen comments', async(done) => {
    try {
      const approval = new Approval({getComments: sinon.stub().returns(comments)}, null)
      approval.countApprovalsAndVetos = sinon.stub()
      // repository, pull_request, last_push, frozenComments, config, token
      await approval.fetchAndCountApprovalsAndVetos(DEFAULT_REPO, PR_PAYLOAD.pull_request, DB_PR.last_push, frozenComments, DEFAULT_CONFIG, TOKEN)
      expect(approval.countApprovalsAndVetos.called).to.be.true
      expect(approval.countApprovalsAndVetos.args[0][2]).to.deep.equal([
        frozenComments[0],
        frozenComments[1],
        comments[1]
      ])
      done()
    } catch (e) {
      done(e)
    }
  })
})

describe('Approval#countApprovalsAndVetos', () => {
  const comments = [{
    user: 'prayerslayer',
    id: 1,
    body: 'awesome :+1:'
  }, {
    user: 'mfellner',
    id: 2,
    body: ':+1:'
  }, {
    user: 'mfellner',
    id: 3,
    body: ':+1:'
  }]

  it('should honor the provided pattern', async(done) => {
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
        user: 'user1'
      }, {
        body: 'awesome',
        user: 'user2'
      }, {
        body: 'lolz',
        user: 'user3'
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
        user: 'user1'
      }, {
        body: 'awesome',
        user: 'user2'
      }, {
        body: 'lolz',
        user: 'user3'
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
        user: 'user1'
      }, {
        body: 'awesome',
        user: 'user2'
      }, {
        body: 'lolz',
        user: 'user3'
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
  let github, pullRequestHandler, approval, auditService


  beforeEach(() => {
    pullRequestHandler = {
      onGet: sinon.stub().returns(DB_PR),
      onAddCommit: sinon.spy(),
      onCreatePullRequest: sinon.spy(),
      onGetFrozenComments: sinon.stub().returns([]),
      onAddFrozenComment: sinon.stub()
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
    auditService = sinon.createStubInstance(AuditService)
    approval = new Approval(github, pullRequestHandler, auditService)
  })

  const SKIP_ACTIONS = ['assigned', 'unassigned', 'labeled', 'unlabeled', 'closed']

  SKIP_ACTIONS.forEach(action=> {
    it(`should do nothing on "${action}"`, async(done) => {
      try {
        await approval.execute(DEFAULT_CONFIG, EVENTS.PULL_REQUEST, Object.assign(PR_PAYLOAD, {action}), TOKEN, DB_REPO_ID)
        expect(github.setCommitStatus.callCount).to.equal(0)
        expect(github.getApprovals.callCount).to.equal(0)
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('should set status to failure on last issue comment when there is a veto comment', async(done) => {
    github.getComments = sinon.stub().returns([{
      body: ':+1:',
      user: 'foo',
      id: 1
    }, {
      body: ':+1:',
      user: 'bar',
      id: 2
    }, {
      body: ':+1:',
      user: 'bar',
      id: 3
    }, {
      body: ':-1:',
      user: 'mr-foo',
      id: 4
    }])
    github.getPullRequest = sinon.stub().returns(PR_PAYLOAD.pull_request)
    try {
      await approval.execute(DEFAULT_CONFIG, EVENTS.ISSUE_COMMENT, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID)

      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      expect(github.getPullRequest.callCount).to.equal(1)
      expect(github.isMemberOfOrg.callCount).to.equal(0)
      expect(auditService.log.callCount).to.equal(1)

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
      user: 'foo',
      id: 1
    }, {
      body: ':+1:',
      user: 'bar',
      id: 2
    }, {
      body: ':+1:',
      user: 'bar',
      id: 3
    }])
    github.getPullRequest = sinon.stub().returns(PR_PAYLOAD.pull_request)
    try {
      await approval.execute(DEFAULT_CONFIG, EVENTS.ISSUE_COMMENT, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID)

      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      expect(github.getPullRequest.callCount).to.equal(1)
      expect(github.isMemberOfOrg.callCount).to.equal(0)
      expect(auditService.log.callCount).to.equal(1)

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
    await approval.execute(DEFAULT_CONFIG, EVENTS.ISSUE_COMMENT, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID)
    expect(github.setCommitStatus.callCount).to.equal(0)
    expect(github.getApprovals.callCount).to.equal(0)
    expect(auditService.log.called).to.be.false
    done()
  })

  it('should set status to pending on PR:opened', async(done) => {
    PR_PAYLOAD.action = 'opened'
    try {
      await approval.execute(DEFAULT_CONFIG, EVENTS.PULL_REQUEST, PR_PAYLOAD, TOKEN, DB_REPO_ID)
      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(0)
      expect(auditService.log.callCount).to.equal(1)

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
      approval.countApprovalsAndVetos = sinon.stub().returns({
        approvals: {total: ['red', 'blue', 'green', 'yellow']},
        vetos: []
      })
      await approval.execute(DEFAULT_CONFIG, EVENTS.PULL_REQUEST, PR_PAYLOAD, TOKEN, DB_REPO_ID)
      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.getComments.callCount).to.equal(1)
      expect(auditService.log.callCount).to.equal(1)

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
    await approval.execute(DEFAULT_CONFIG, EVENTS.PULL_REQUEST, PR_PAYLOAD, TOKEN, DB_REPO_ID)
    expect(github.setCommitStatus.callCount).to.equal(1)
    expect(github.setCommitStatus.args[0]).to.deep.equal([
      'mfellner',
      'hello-world',
      PR_PAYLOAD.pull_request.head.sha,
      ZERO_APPROVALS_STATUS,
      TOKEN
    ])
    expect(auditService.log.callCount).to.equal(1)
    done()
  })

  it('should set status to error when auditService.log throws', async(done) => {
    try {
      PR_PAYLOAD.action = 'synchronize'
      auditService.log = sinon.stub().throws(new Error('Audit API Error'))
      await approval.execute(DEFAULT_CONFIG, PR_PAYLOAD, TOKEN, DB_REPO_ID)

      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.setCommitStatus.args[1][3].state).to.equal('error')
      expect(github.setCommitStatus.args[1][3].description).to.equal('Audit API Error')
      done()
    } catch (e) {
      done(e)
    }
  })

  const TRIGGER_ISSUE_ACTIONS = ['edited', 'deleted']
  TRIGGER_ISSUE_ACTIONS.forEach(action => {
    it(`should detect a maliciously ${action} comment and freeze it`, async(done) => {
      try {
        const payload = Object.assign({}, MALICIOUS_PAYLOAD, {action})
        github.getPullRequest = sinon.stub()
                                     .withArgs(DEFAULT_REPO.owner.login, DEFAULT_REPO.name, payload.issue.number, TOKEN)
                                     .returns(PR_PAYLOAD.pull_request)
        pullRequestHandler.getOrCreateDbPullRequest = sinon.stub()
                                                           .withArgs(DB_REPO_ID, payload.issue.number)
                                                           .returns(DB_PR)
        github.getComments = sinon.stub().returns([]) // does not matter for this test
        await approval.execute(DEFAULT_CONFIG, EVENTS.ISSUE_COMMENT, payload, TOKEN, DB_REPO_ID)
        expect(pullRequestHandler.onGetFrozenComments.calledOnce).to.be.true
        expect(pullRequestHandler.onGetFrozenComments.calledWith(DB_PR.id, DB_PR.last_push)).to.be.true
        expect(pullRequestHandler.onAddFrozenComment.calledOnce).to.be.true
        const expectedFrozenComment = {
          id: payload.comment.id,
          body: action === 'edited' ? payload.changes.body.from : payload.comment.body,
          created_at: payload.comment.created_at,
          user: payload.comment.user.login
        }
        expect(pullRequestHandler.onAddFrozenComment.args[0]).to.deep.equal([DB_PR.id, expectedFrozenComment])
        done()
      } catch (e) {
        done(e)
      }
    })

    it(`should not freeze comments that were ${action} by the author`, async(done) => {
      try {
        const payload = Object.assign({}, REGULAR_ISSUE_PAYLOAD, {action})
        github.getPullRequest = sinon.stub()
                                     .withArgs(DEFAULT_REPO.owner.login, DEFAULT_REPO.name, payload.issue.number, TOKEN)
                                     .returns(PR_PAYLOAD.pull_request)
        pullRequestHandler.getOrCreateDbPullRequest = sinon.stub()
                                                           .withArgs(DB_REPO_ID, payload.issue.number)
                                                           .returns(DB_PR)
        github.getComments = sinon.stub().returns([]) // does not matter for this test
        await approval.execute(DEFAULT_CONFIG, EVENTS.ISSUE_COMMENT, payload, TOKEN, DB_REPO_ID)
        expect(pullRequestHandler.onGetFrozenComments.calledOnce).to.be.true
        expect(pullRequestHandler.onGetFrozenComments.calledWith(DB_PR.id, DB_PR.last_push)).to.be.true
        expect(pullRequestHandler.onAddFrozenComment.calledOnce).to.be.false
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('should not freeze newly created comments', async(done) => {
    try {
      const payload = Object.assign({}, MALICIOUS_PAYLOAD, {action: 'created'})
      github.getPullRequest = sinon.stub()
                                   .withArgs(DEFAULT_REPO.owner.login, DEFAULT_REPO.name, payload.issue.number, TOKEN)
                                   .returns(PR_PAYLOAD.pull_request)
      pullRequestHandler.getOrCreateDbPullRequest = sinon.stub()
                                                         .withArgs(DB_REPO_ID, payload.issue.number)
                                                         .returns(DB_PR)
      github.getComments = sinon.stub().returns([]) // does not matter for this test
      await approval.execute(DEFAULT_CONFIG, EVENTS.ISSUE_COMMENT, payload, TOKEN, DB_REPO_ID)
      expect(pullRequestHandler.onGetFrozenComments.calledOnce).to.be.true
      expect(pullRequestHandler.onGetFrozenComments.calledWith(DB_PR.id, DB_PR.last_push)).to.be.true
      expect(pullRequestHandler.onAddFrozenComment.called).to.be.false
      done()
    } catch (e) {
      done(e)
    }
  })

  it('should merge frozen comments back in upstream comments', async(done) => {
    try {
      github.getPullRequest = sinon.stub()
                                   .withArgs(DEFAULT_REPO.owner.login, DEFAULT_REPO.name, MALICIOUS_PAYLOAD.issue.number, TOKEN)
                                   .returns(PR_PAYLOAD.pull_request)
      pullRequestHandler.getOrCreateDbPullRequest = sinon.stub()
                                                         .withArgs(DB_REPO_ID, MALICIOUS_PAYLOAD.issue.number)
                                                         .returns(DB_PR)
      const frozenComments = [{
        id: 1,
        body: ':-1:',
        user: 'foo'
      }, {
        id: 2,
        body: 'This does not look good.',
        user: 'bar'
      }]
      const upstreamComments = [{
        id: 2,
        body: ':+1:',
        user: 'bar'
      }, {
        id: 3,
        body: ':+1:',
        user: 'baz'
      }]
      pullRequestHandler.onGetFrozenComments = sinon.stub()
                                                    .withArgs(DB_PR.id, DB_PR.last_push)
                                                    .returns(frozenComments)
      github.getComments = sinon.stub()
                                .returns(upstreamComments)
      await approval.execute(DEFAULT_CONFIG, EVENTS.ISSUE_COMMENT, ISSUE_PAYLOAD, TOKEN, DB_REPO_ID)
      expect(pullRequestHandler.onGetFrozenComments.calledOnce).to.be.true
      expect(pullRequestHandler.onGetFrozenComments.calledWith(DB_PR.id, DB_PR.last_push)).to.be.true
      expect(pullRequestHandler.onAddFrozenComment.calledOnce).to.be.false
      expect(github.setCommitStatus.callCount).to.equal(2)
      expect(github.setCommitStatus.args[1][3].state).to.equal('failure')
      expect(github.setCommitStatus.args[1][3].description).to.equal('Vetoes: @foo.')
      done()
    } catch (e) {
      done(e)
    }
  })
})
