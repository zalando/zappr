import sinon from 'sinon'
import { expect } from 'chai'
import Autobranch from '../../server/checks/Autobranch'

const CONFIG = {
  autobranch: {
    pattern: '{number}-{title}',
    length: 60
  }
}
const TOKEN = 'token'
const REPO = {
  name: 'hello-world',
  default_branch: 'master',
  owner: {
    login: 'mfellner'
  }
}
const REF = {
  sha: 'abcd'
}
const ISSUE = {
  number: 124,
  labels: [],
  title: '💡 This should häve 1 emoji 😈 for sure'
}
const OPEN_PAYLOAD = {
  repository: REPO,
  action: 'opened',
  issue: ISSUE
}

describe('Autobranch', () => {
  describe('#createBranchNamefromIssue', () => {
    const branchName = Autobranch.createBranchNameFromIssue
    it('should drop emojis', () => {
      expect(branchName(ISSUE, CONFIG.autobranch)).to.equal('124-this-should-hve-1-emoji-for-sure')
    })
    it('should drop japanese', () => {
      const NIPPON = Object.assign({}, ISSUE, { title: 'なうてててしか' })
      expect(branchName(NIPPON, CONFIG.autobranch)).to.equal('124-')
    })
    it('should preserve ascii', () => {
      const ENGLISH = Object.assign({}, ISSUE, { title: 'An error in README.md'})
      expect(branchName(ENGLISH, CONFIG.autobranch)).to.equal('124-an-error-in-readmemd')
    })
    it('should honor length config', () => {
      expect(branchName(ISSUE, {length: 20}).length).to.equal(20)
    })
    it('should stick to pattern', () => {
      expect(branchName(ISSUE, {pattern: '{title}'})).to.equal('this-should-hve-1-emoji-for-sure')
    })
    it('should deal with labels', () => {
      const LABELS = Object.assign({}, ISSUE, {labels: [{name: 'foo: 😈'}, {name: 'て: bar'}]})
      expect(branchName(LABELS, {
        pattern: '{number}-{labels}-{title}',
        length: 100})).to.equal('124-foo-bar-this-should-hve-1-emoji-for-sure')
    })
  })
  describe('#execute', () => {
    var github

    beforeEach(() => {
      github = {
        getHead: sinon.stub().returns(REF),
        createBranch: sinon.spy()
      }
    })

    it('should create a branch from the default branch head ref', async (done) => {
      try {
        await Autobranch.execute(github, CONFIG, OPEN_PAYLOAD, TOKEN)
        expect(github.getHead.calledOnce).to.be.true
        expect(github.createBranch.calledOnce).to.be.true
        const headArgs = github.getHead.args[0]
        const branchArgs = github.createBranch.args[0]
        expect(headArgs).to.deep.equal([
          REPO.owner.login,
          REPO.name,
          REPO.default_branch,
          TOKEN
        ])
        expect(branchArgs).to.deep.equal([
          REPO.owner.login,
          REPO.name,
          '124-this-should-hve-1-emoji-for-sure',
          REF.sha,
          TOKEN
        ])
        done()
      } catch(e) {
        done(e)
      }
    })

    it('should ignore non-opened issues', async (done) => {
      const NOT_OPEN = Object.assign({}, OPEN_PAYLOAD, {action: 'closed'})
      try {
        await Autobranch.execute(github, CONFIG, NOT_OPEN, TOKEN)
        expect(github.getHead.callCount).to.equal(0)
        expect(github.createBranch.callCount).to.equal(0)
        done()
      } catch(e) {
        done(e)
      }
    })
  })
})
