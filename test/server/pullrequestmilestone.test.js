import sinon from 'sinon'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'
import PullRequestMilestone, { generateStatus } from '../../server/checks/PullRequestMilestone'

describe('Pull Request Milestone', () => {
  describe('#generateStatus', () => {
    it('generates failure when there is no Milestone set', () => {
      const milestone = null;
      const status = generateStatus(milestone)
      expect(status.description).to.equal(`PR has no milestone set.`)
      expect(status.state).to.equal('failure')
    })

    it('generates success when there is a Milestone set', () => {
      const milestone = 'milestone';
      const status = generateStatus(milestone)
      expect(status.description).to.equal(`PR has a milestone set.`)
      expect(status.state).to.equal('success')
    })
  })
})
