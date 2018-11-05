import sinon from 'sinon'
import { expect } from 'chai'
import { GithubService } from '../../server/service/GithubService'
import PullRequestMergeCommit, { generateStatus } from '../../server/checks/PullRequestMergeCommit'

describe('Pull Request Milestone', () => {
  describe('#generateStatus', () => {
    it('generates failure when there is a merge commit', () => {
      const commits = [{
          sha: '1commit',
          commit: {
            message: 'no merge commit'
          },
          parents: [{}]
        }, {
          sha: '2commit',
          commit: {
            message: 'no merge commit'
          },
          parents: [{}]
        }, {
          sha: '3commit',
          commit: {
            message: 'merge commit'
          },
          parents: [{}, {}]
        }]
      const status = generateStatus(commits)
      expect(status.description).to.equal(`PR contains 1 merge commit.`)
      expect(status.state).to.equal('failure')
    })

    it('generates failure when there are more merge commit', () => {
      const commits = [{
          sha: '1commit',
          commit: {
            message: 'no merge commit'
          },
          parents: [{}]
        }, {
          sha: '2commit',
          commit: {
            message: 'merge commit'
          },
          parents: [{}, {}]
        }, {
          sha: '3commit',
          commit: {
            message: 'no merge commit'
          },
          parents: [{}]
        }, {
          sha: '4commit',
          commit: {
            message: 'merge commit'
          },
          parents: [{}, {}]
        }]
      const status = generateStatus(commits)
      expect(status.description).to.equal(`PR contains 2 merge commits.`)
      expect(status.state).to.equal('failure')
    })

    it('generates success when there is no merge commit', () => {
      const commits = [{
          sha: '1commit',
          commit: {
            message: 'no merge commit'
          },
          parents: [{}]
        }, {
          sha: '2commit',
          commit: {
            message: 'no merge commit'
          },
          parents: [{}]
        }]
      const status = generateStatus(commits)
      expect(status.description).to.equal(`PR doesn't contain merge commits.`)
      expect(status.state).to.equal('success')
    })
  })
})
