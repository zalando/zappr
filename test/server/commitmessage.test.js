import sinon from 'sinon'
import { expect } from 'chai'
import CommitMessage, {getAnyMatcherFn} from '../../server/checks/CommitMessage'

const CONFIG = {
  commit: {
    message: {
      patterns: ['#[0-9]+']
    }
  }
}
const TOKEN = 'token'
const REPO = {
  name: 'hello-world',
  full_name: 'mfellner/hello-world',
  owner: {
    login: 'mfellner'
  }
}
const PR = {
  number: 124,
  state: 'open',
  head: {
    sha: '123'
  }
}

describe('CommitMessage', () => {
  describe('#getAnyMatcherFn', () => {
    it('should match one pattern', () => {
      const fn = getAnyMatcherFn(CONFIG.commit.message.patterns.map(p => new RegExp(p)))
      expect(fn('#123')).to.be.true
      expect(fn('123')).to.be.false
      expect(fn('#0')).to.be.true
      expect(fn('#')).to.be.false
      expect(fn('foo')).to.be.false
    })
    it('should match one of multiple patterns', () => {
      const fn = getAnyMatcherFn(CONFIG.commit.message.patterns.concat(['foo']).map(p => new RegExp(p)))
      expect(fn('#123')).to.be.true
      expect(fn('123')).to.be.false
      expect(fn('#0')).to.be.true
      expect(fn('#')).to.be.false
      expect(fn('foo')).to.be.true
    })
    it('should work with emojis', () => {
      // because https://github.com/dannyfritz/commit-message-emoji
      const regexString = '^(🎉|💩|🐛|📚)'
      const fn = getAnyMatcherFn([new RegExp(regexString)])
      const messages = ['🎉 tada', '💩', '🐛 bugfix', '📚']
      messages.forEach(emoji => expect(fn(emoji)).to.be.true)
    })
  })
  describe('#execute', () => {
    let github, commitMessage

    beforeEach(() => {
      github = {
        setCommitStatus: sinon.spy(),
        fetchPullRequestCommits: sinon.spy()
      }
      commitMessage = new CommitMessage(github)
    })

    it('should do nothing when action is not opened or synced and/or PR is not open', async (done) => {
      try {
        const notOpenedOrSyncedPayload = {
          pull_request: PR,
          action: 'closed',
          number: PR.number,
          repository: REPO
        }
        await commitMessage.execute(CONFIG, notOpenedOrSyncedPayload, TOKEN)
        expect(github.setCommitStatus.callCount).to.equal(0)
        expect(github.fetchPullRequestCommits.callCount).to.equal(0)

        const notOpenPayload = {
          pull_request: Object.assign({}, PR, { state: 'closed' }),
          action: 'synchronize',
          number: PR.number,
          repository: REPO
        }
        await commitMessage.execute(CONFIG, notOpenPayload, TOKEN)
        expect(github.setCommitStatus.callCount).to.equal(0)
        expect(github.fetchPullRequestCommits.callCount).to.equal(0)
        done()
      } catch(e) {
        done(e)
      }
    })
    it('should set status to success when there are no patterns', async (done) => {
      try {
        const payload = {
          pull_request: PR,
          action: 'opened',
          number: PR.number,
          repository: REPO
        }
        await commitMessage.execute({}, payload, TOKEN)
        expect(github.setCommitStatus.callCount).to.equal(1)
        expect(github.setCommitStatus.args[0]).to.deep.equal([
          REPO.owner.login,
          REPO.name,
          PR.head.sha, {
            state: 'success',
            description: 'No patterns configured to match commit messages against.',
            context: 'zappr/commit/message'
          },
          TOKEN
        ])
        expect(github.fetchPullRequestCommits.callCount).to.equal(0)
        done()
      } catch (e) {
        done(e)
      }
    })
    it('should set status to success when everything is fine', async(done) => {
      try {
        const commits = [{
          sha: '1commit',
          commit: {
            message: '#007 james bond'
          }
        }, {
          sha: '2commit',
          commit: {
            message: `also matching, but multiline
#552`
          }
        }, {
          sha: '3commit',
          commit: {
            message: `does not have to be at beginning: #123`
          }
        }, {
          sha: '4commit',
          commit: {
            message: 'not matching, but merge commit'
          },
          parents: [{}, {}]
        }]
        const payload = {
          pull_request: PR,
          action: 'opened',
          number: PR.number,
          repository: REPO
        }
        github.fetchPullRequestCommits = sinon.stub().returns(commits)
        await commitMessage.execute(CONFIG, payload, TOKEN)
        expect(github.fetchPullRequestCommits.callCount).to.equal(1)
        expect(github.setCommitStatus.callCount).to.equal(2)
        expect(github.setCommitStatus.args.map(a => a[3].state)).to.deep.equal(['pending', 'success'])
        expect(github.setCommitStatus.args[1][3].description).to.equal("All commit messages match at least one configured pattern.")
        done()
      } catch (e) {
        done(e)
      }
    })
    it('should set status to failure when there are evil commits', async (done) => {
      try {
        const commits = [{
          sha: '1commit',
          commit: {
            message: 'not matching'
          },
          parents: [{}]
        }, {
          sha: '2commit',
          commit: {
            message: '#134 i am fine'
          },
          parents: [{}]
        }, {
          sha: '3commit',
          commit: {
            message: 'also not matching'
          },
          parents: [{}]
        }, {
          sha: '4commit',
          commit: {
            message: 'not matching either, but merge commit'
          },
          parents: [{}, {}]
        }]
        const payload = {
          pull_request: PR,
          action: 'synchronize',
          number: PR.number,
          repository: REPO
        }
        github.fetchPullRequestCommits = sinon.stub().returns(commits)
        await commitMessage.execute(CONFIG, payload, TOKEN)
        expect(github.fetchPullRequestCommits.callCount).to.equal(1)
        expect(github.fetchPullRequestCommits.args[0]).to.deep.equal([
          REPO.owner.login,
          REPO.name,
          PR.number,
          TOKEN
        ])
        expect(github.setCommitStatus.callCount).to.equal(2)
        expect(github.setCommitStatus.args.map(a => a[3].state)).to.deep.equal(['pending', 'failure'])
        expect(github.setCommitStatus.args[1][3].description).to.equal('Commits 1commi, 3commi do not match configured patterns.')
        done()
      } catch(e) {
        done(e)
      }
    })
  })
})
