import sinon from 'sinon'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'
import PullRequestSize, { generateStatus } from '../../server/checks/PullRequestSize'


describe('Pull Request Size', () => {
  describe('#generateStatus', () => {
    it('generates failure when there are redundant labels and additional = false', () => {
      const status = generateStatus(labels, {size: {max: {additions: 10}}})
      expect(status.description).to.equal(`PR has redundant labels: work-in-progress.`)
      expect(status.state).to.equal('failure')
    })
  })
})
