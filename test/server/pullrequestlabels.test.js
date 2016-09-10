import sinon from 'sinon'
import { expect } from 'chai'
import {GithubService} from '../../server/service/GithubService'
import PullRequestLabels, { generateStatus } from '../../server/checks/PullRequestLabels'


describe('Pull Request Labels', () => {
  describe('#generateStatus', () => {
    it('generates failure when verboten labels are present', () => {
      const labels = ['work-in-progress', 'approved']
      const verboten = ['work-in-progress']
      const status = generateStatus(labels, {verboten, required: []})
      expect(status.description).to.equal(`PR has verboten labels: work-in-progress.`)
      expect(status.state).to.equal('failure')
    })

    it('generates failure when required labels are missing', () => {
      const labels = ['approved']
      const required = ['ux-approved', 'approved']
      const status = generateStatus(labels, {required, verboten: []})
      expect(status.description).to.equal(`PR misses required labels: ux-approved.`)
      expect(status.state).to.equal('failure')
    })

    it('checks verboten first', () => {
      const labels = ['approved', 'ux-approved', 'work-in-progress']
      const required = ['ux-approved', 'approved']
      const verboten = ['work-in-progress']
      const status = generateStatus(labels, {required, verboten})
      expect(status.description).to.equal(`PR has verboten labels: work-in-progress.`)
      expect(status.state).to.equal('failure')
    })

    it('generates success otherwise', () => {
      const labels = ['approved']
      const required = ['approved']
      const status = generateStatus(labels, {required, verboten: []})
      expect(status.description).to.equal('PR has all required labels.')
      expect(status.state).to.equal('success')
    })
  })

  describe('#execute', () => {
    let prLabels, github
    beforeEach(() => {
      github = sinon.createStubInstance(GithubService)
      prLabels = new PullRequestLabels(github)
    })

    const TOKEN = 'token'
    const PAYLOAD = {
      number: 1,
      action: 'labeled',
      pull_request: {
        state: 'open',
        head: {
          sha: 'commit-id'
        }
      },
      repository: {
        name: 'hello-world',
        owner: {
          login: 'prayerslayer'
        }
      }
    }
    const CONFIG = {
      'pull-request': {
        labels: {
          required: ['approved'],
          verboten: ['wip']
        }
      }
    }
    const REACT_ON = ['labeled', 'unlabeled', 'opened', 'reopened']
    const IGNORE = ['synchronize', 'assigned', 'unassigned', 'closed', 'edited']
    const ALL = [...REACT_ON, ...IGNORE]
    ALL.forEach(action =>
      it(`ignores everything with state = closed`, async(done) => {
        try {
          await prLabels.execute(CONFIG, Object.assign({}, PAYLOAD, {action, pull_request: {state: 'closed'}}), TOKEN)
          expect(github.getIssueLabels.called).to.be.false
          done()
        } catch (e) {
          done(e)
        }
      }))

    REACT_ON.forEach(action =>
      it(`reacts on "${action}"`, async(done) => {
        try {
          await prLabels.execute(CONFIG, Object.assign({}, PAYLOAD, {action}), TOKEN)
          expect(github.getIssueLabels.called).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      }))

    IGNORE.forEach(action =>
      it(`does not react on "${action}"`, async(done) => {
        try {
          await prLabels.execute(CONFIG, Object.assign({}, PAYLOAD, {action}), TOKEN)
          expect(github.getIssueLabels.called).to.be.false
          done()
        } catch (e) {
          done(e)
        }
      }))

    it('does nothing when config is empty', async(done) => {
      try {
        await prLabels.execute({}, PAYLOAD, TOKEN)
        expect(github.getIssueLabels.called).to.be.false
        done()
      } catch (e) {
        done(e)
      }
    })

    it('calls githubService with correct arguments', async(done) => {
      try {
        github.getIssueLabels = sinon.stub().returns(['wip'])
        await prLabels.execute(CONFIG, PAYLOAD, TOKEN)
        expect(github.getIssueLabels.args).to.deep.equal([
          ['prayerslayer', 'hello-world', 1, TOKEN]
        ])
        const expectedStatus = {
          state: 'failure',
          context: 'zappr/pr/labels',
          description: `PR has verboten labels: wip.`
        }
        expect(github.setCommitStatus.args).to.deep.equal([
          ['prayerslayer', 'hello-world', 'commit-id', expectedStatus, TOKEN]
        ])
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
