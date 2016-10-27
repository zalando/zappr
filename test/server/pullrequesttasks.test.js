import sinon from 'sinon'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'
import PullRequestTasks, { countOpenTasks } from '../../server/checks/PullRequestTasks'

describe('Pull Request Tasks', () => {
  const prOpenTasks = require('../fixtures/webhook.pull_request_open_tasks');
  const prOpenTasksWithTextAbove = require('../fixtures/webhook.pull_request_open_tasks_with_text_above');
  const prNoTasks = require('../fixtures/webhook.pull_request_no_tasks');

  describe('#countOpenTasks', () => {
    it('returns true when there are open tasks', () => {
      const count = countOpenTasks(prOpenTasks.body)
      expect(count).is.above(0)
    })

    it('returns false when there are no open tasks', () => {
      const count = countOpenTasks(prNoTasks.body)
      expect(count).is.eql(0)
    })

    it('returns true when there are open tasks with text above', () => {
      const count = countOpenTasks(prOpenTasksWithTextAbove.body)
      expect(count).is.above(0)
    })
  })

  describe('#execute', () => {
    let prTasks, github
    beforeEach(() => {
      github = sinon.createStubInstance(GithubService)
      prTasks = new PullRequestTasks(github)
    })

    const TOKEN = 'token'
    const PAYLOAD = {
      number: 1,
      action: 'opened',
      pull_request: {
        body: '- [x] test1\r\n- [x] test2\r\n- [] test3\r\n-[ ] test4\r\n- [ ] test5\r\n- [ ]test6\r\n-[x]test7\r\n - [x] test8\r\n- [ ] test2',
        state: 'open',
        number: 1,
        head: {
          sha: 'commit-id',
          repo: {
            full_name: 'tunix/zappr'
          }
        }
      },
      repository: {
        name: 'zappr',
        full_name: 'tunix/zappr',
        owner: {
          login: 'tunix'
        }
      }
    }
    const CONFIG = {}
    const REACT_ON = ['opened', 'edited', 'reopened']
    const IGNORE = ['synchronize', 'assigned', 'unassigned', 'closed', 'labeled', 'unlabeled']
    const ALL = [...REACT_ON, ...IGNORE]

    ALL.forEach(action =>
      it('ignores everything with state = closed', async(done) => {
        try {
          await prTasks.execute(CONFIG, Object.assign({}, PAYLOAD, {action, pull_request: {state: 'closed'}}), TOKEN)
          expect(github.setCommitStatus.called).to.be.false
          done()
        } catch (e) {
          done(e)
        }
      }))

    REACT_ON.forEach(action =>
      it(`reacts on "${action}"`, async(done) => {
        try {
          await prTasks.execute(CONFIG, Object.assign({}, PAYLOAD, {action}), TOKEN)
          expect(github.setCommitStatus.called).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      }))

    IGNORE.forEach(action =>
      it(`does not react on "${action}"`, async(done) => {
        try {
          await prTasks.execute(CONFIG, Object.assign({}, PAYLOAD, {action}), TOKEN)
          expect(github.setCommitStatus.called).to.be.false
          done()
        } catch (e) {
          done(e)
        }
      }))

    it('calls githubService with correct arguments when PR has open tasks', async(done) => {
      try {
        await prTasks.execute(CONFIG, PAYLOAD, TOKEN)
        const expectedStatus = {
          state: 'failure',
          context: 'zappr/pr/tasks',
          description: `PR has 3 open tasks.`
        }

        expect(github.setCommitStatus.args).to.deep.equal([
          ['tunix', 'zappr', 'commit-id', expectedStatus, TOKEN]
        ])

        done()
      } catch (e) {
        done(e)
      }
    })

    it('calls githubService with correct arguments when PR has no open tasks', async(done) => {
      try {
        let payload = Object.assign({}, PAYLOAD);

        payload.pull_request.body = "- [x] test1\r\n- [x] test2";
        await prTasks.execute(CONFIG, payload, TOKEN)

        const expectedStatus = {
          state: 'success',
          context: 'zappr/pr/tasks',
          description: `PR has no open tasks.`
        }

        expect(github.setCommitStatus.args).to.deep.equal([
          ['tunix', 'zappr', 'commit-id', expectedStatus, TOKEN]
        ])

        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
