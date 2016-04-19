import sinon from 'sinon'
import { expect } from 'chai'
import CommitMessage, {getMatchFn} from '../../server/checks/CommitMessage'

const CONFIG = {
  commit: {
    message: {
      patterns: ['^#[0-9]+']
    }
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
const PR = {
  number: 124,
  head: {
    sha: '123'
  }
}

describe('CommitMessage', () => {
  describe('#getMatchFn', () => {
    it('should match one pattern', () => {
      const fn = getMatchFn(CONFIG.commit.message.patterns.map(p => new RegExp(p)))
      expect(fn('#123')).to.be.true
      expect(fn('123')).to.be.false
      expect(fn('#0')).to.be.true
      expect(fn('#')).to.be.false
      expect(fn('foo')).to.be.false
    })
    it('should match one of multiple patterns', () => {
      const fn = getMatchFn(CONFIG.commit.message.patterns.concat(['foo']).map(p => new RegExp(p)))
      expect(fn('#123')).to.be.true
      expect(fn('123')).to.be.false
      expect(fn('#0')).to.be.true
      expect(fn('#')).to.be.false
      expect(fn('foo')).to.be.true
    })
  })
  describe('#execute', () => {
    var github

    beforeEach(() => {
      github = {
        getHead: sinon.stub().returns(REF)
      }
    })
  })
})
