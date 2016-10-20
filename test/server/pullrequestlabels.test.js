import sinon from 'sinon'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'
import PullRequestLabels, { generateStatus } from '../../server/checks/PullRequestLabels'


describe('Pull Request Labels', () => {
  describe('#generateStatus', () => {
    it('generates failure when there are redundant labels and additional = false', () => {
      const labels = ['work-in-progress', 'approved']
      const required = ['approved']
      const status = generateStatus(labels, {additional: false, required})
      expect(status.description).to.equal(`PR has redundant labels: work-in-progress.`)
      expect(status.state).to.equal('failure')
    })

    it('generates success when there are redundant labels and additional = true', () => {
      const labels = ['work-in-progress', 'approved']
      const required = ['approved']
      const status = generateStatus(labels, {additional: true, required})
      expect(status.description).to.equal(`PR has all required labels.`)
      expect(status.state).to.equal('success')
    })

    const ADDITIONAL = [true, false]
    ADDITIONAL.forEach(additional => {
      it(`[additional: ${additional}] generates failure when required labels are missing`, () => {
        const labels = ['approved']
        const required = ['ux-approved', 'approved']
        const status = generateStatus(labels, {required, additional})
        expect(status.description).to.equal(`PR misses required labels: ux-approved.`)
        expect(status.state).to.equal('failure')
      })

      it(`[additional: ${additional}] generates success otherwise`, () => {
        const labels = ['approved']
        const required = ['approved']
        const status = generateStatus(labels, {required, additional})
        expect(status.description).to.equal('PR has all required labels.')
        expect(status.state).to.equal('success')
      })
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
      action: 'labeled',
      pull_request: {
        number: 1,
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
          additional: false
        }
      }
    }
    const REACT_ON = ['labeled', 'unlabeled', 'opened', 'reopened']
    const IGNORE = ['synchronize', 'assigned', 'unassigned', 'closed', 'edited']
    const ALL = [...REACT_ON, ...IGNORE]
    ALL.forEach(action =>
      it(`ignores everything with state = closed`, async(done) => {
        try {
          await prLabels.execute({
            config: CONFIG,
            payload: Object.assign({}, PAYLOAD, {action, pull_request: {state: 'closed'}}),
            token: TOKEN
          })
          expect(github.getIssueLabels.called).to.be.false
          done()
        } catch (e) {
          done(e)
        }
      }))

    REACT_ON.forEach(action =>
      it(`reacts on "${action}"`, async(done) => {
        try {
          await prLabels.execute({
            config: CONFIG,
            payload: Object.assign({}, PAYLOAD, {action}),
            token: TOKEN
          })
          expect(github.getIssueLabels.called).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      }))

    IGNORE.forEach(action =>
      it(`does not react on "${action}"`, async(done) => {
        try {
          await prLabels.execute({
            config: CONFIG,
            payload: Object.assign({}, PAYLOAD, {action}),
            token: TOKEN
          })
          expect(github.getIssueLabels.called).to.be.false
          done()
        } catch (e) {
          done(e)
        }
      }))

    it('does nothing when config is empty', async(done) => {
      try {
        await prLabels.execute({
          config: {},
          payload: PAYLOAD,
          token: TOKEN
        })
        expect(github.getIssueLabels.called).to.be.false
        done()
      } catch (e) {
        done(e)
      }
    })

    it('calls githubService with correct arguments', async(done) => {
      try {
        github.getIssueLabels = sinon.stub().returns(['approved', 'wip'])
        await prLabels.execute({
          config: CONFIG,
          payload: PAYLOAD,
          token: TOKEN
        })
        expect(github.getIssueLabels.args).to.deep.equal([
          ['prayerslayer', 'hello-world', 1, TOKEN]
        ])
        const expectedStatus = {
          state: 'failure',
          context: 'zappr/pr/labels',
          description: `PR has redundant labels: wip.`
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
