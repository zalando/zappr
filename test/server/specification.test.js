import sinon from 'sinon'
import { expect } from 'chai'
import { Specification } from '../../server/checks'
import { GithubService } from '../../server/service/GithubService'

describe('Specification', () => {
  describe('#execute', () => {
    const TITLE_REQUIRED_LENGTH = 8
    const BODY_REQUIRED_LENGTH = 8

    const TOKEN = 'token'
    const STATES = ['open', 'close']
    const ACTIONS = ['opened', 'edited', 'reopened', 'synchronize']
    const SKIP_ACTIONS = ['assigned', 'unassigned', 'labeled', 'unlabeled', 'closed']

    const config = (specification) => ({ specification })

    let github, pullRequest

    beforeEach(() => {
      github = sinon.createStubInstance(GithubService)
      github.readPullRequestTemplate.returns(Promise.reject())
      pullRequest = new Specification(github)
    })

    SKIP_ACTIONS.forEach(action => {
      STATES.forEach(state => {
        it(`[action: '${action}'][state: '${state}'] should do nothing`, async (done) => {
          try {
            const payload = createPayload({
              action,
              pull_request: {
                state
              }
            })

            await pullRequest.execute(config(), payload, TOKEN)
            expect(github.setCommitStatus.called).to.be.false
            done()
          } catch (e) {
            done(e)
          }
        })
      })
    })

    ACTIONS.forEach(action => {
      it(`[action: '${action}'] should do nothing if state is 'close'`, async (done) => {
        try {
          const payload = createPayload(action, {
            state: 'close'
          })

          await pullRequest.execute(config(), payload, TOKEN)
          expect(github.setCommitStatus.called).to.be.false
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'success' if PR's title's length is more than ${TITLE_REQUIRED_LENGTH}`, async (done) => {
        try {
          const payload = createPayload(action, {
            state: 'open',
            title: 'This one is a good title for the PR',
            body: 'This one is a good body for the PR'
          })

          await pullRequest.execute(config(), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'success',
              context: 'zappr/pr/specification',
              description: 'PR has passed specification checks'
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'failure' if PR's title's length is less than ${TITLE_REQUIRED_LENGTH}`, async (done) => {
        try {
          const title = 'short'
          const payload = createPayload(action, {
            title,
            state: 'open',
            body: 'This one is a good body for the PR'
          })

          await pullRequest.execute(config(), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'failure',
              context: 'zappr/pr/specification',
              description: `PR's title is too short (${title.length}/${TITLE_REQUIRED_LENGTH})`
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'success' if PR's body's length is more than ${BODY_REQUIRED_LENGTH}`, async (done) => {
        try {
          const payload = createPayload(action, {
            state: 'open',
            title: 'This one is a good title for the PR',
            body: 'This one is a good body for the PR'
          })

          await pullRequest.execute(config(), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'success',
              context: 'zappr/pr/specification',
              description: 'PR has passed specification checks'
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'failure' if PR's body's length is less than ${BODY_REQUIRED_LENGTH}`, async (done) => {
        try {
          const body = 'short'
          const payload = createPayload(action, {
            body,
            state: 'open',
            title: 'This one is a good title for the PR'
          })

          await pullRequest.execute(config(), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'failure',
              context: 'zappr/pr/specification',
              description: `PR's body failed check 'contains-issue-number'`
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      });

      ['#4', 'Fix #4', 'user/repo#42', 'closes user/repo#42',
        'some-org/repo#42', 'http://tracker.com', 'https://tracker.com',
        'www.issues.example.com', 'Fix for http://some.tracker.com/issues/42'
      ].forEach(body => {
        it(`[action: '${action}'] should set status to 'success' for body '${body}'`, async (done) => {
          try {
            const payload = createPayload(action, {
              body,
              state: 'open',
              title: 'This one is a good title for the PR'
            })

            await pullRequest.execute(config({
              body: { // make sure that issue and url are real validators
                'minimum-length': {
                  enabled: false
                }
              }
            }), payload, TOKEN)
            expect(github.setCommitStatus.calledWithExactly(
              'sample', 'one', '1a2b3c', {
                state: 'success',
                context: 'zappr/pr/specification',
                description: 'PR has passed specification checks'
              }, 'token'
            )).to.be.true
            done()
          } catch (e) {
            done(e)
          }
        })
      })

      it(`[action: '${action}'] should set status to 'success' if title's ` +
        `length is less than 'title.minimum-length.length' and ` +
        `'title.minimum-length.enabled' is false`, async (done) => {
        try {
          const payload = createPayload(action, {
            state: 'open',
            title: 'ugh?',
            body: 'This is a good body for the PR'
          })

          await pullRequest.execute(config({
            title: {
              'minimum-length': {
                enabled: false
              }
            }
          }), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'success',
              context: 'zappr/pr/specification',
              description: 'PR has passed specification checks'
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'success' if body is not ` +
      `equal to PR template and other checks are disabled`, async (done) => {
        try {
          github.readPullRequestTemplate.returns(
            Promise.resolve('Issue #'))

          const payload = createPayload(action, {
            state: 'open',
            title: 'This is a good title for the PR',
            body: 'Issue #42'
          })

          await pullRequest.execute(config({
            body: {
              'minimum-length': {
                enabled: false
              },
              'contains-url': false,
              'contains-issue-number': false,
              'differs-from-pr-template': true
            }
          }), payload, TOKEN)

          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'success',
              context: 'zappr/pr/specification',
              description: 'PR has passed specification checks'
            }, 'token'
          ))
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'failure' if body contains ` +
        `issue number when 'body.contains-issue-number' is false`, async (done) => {
        try {
          const payload = createPayload(action, {
            state: 'open',
            title: 'This is a good title for the PR',
            body: '#4'
          })

          await pullRequest.execute(config({
            body: {
              'contains-issue-number': false
            }
          }), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'failure',
              context: 'zappr/pr/specification',
              description: `PR's body failed check 'contains-url'`
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'failure' if body contains ` +
        `url when 'body.minimum-length.enabled' is false and ` +
        `'body.contains-url' is false`, async (done) => {
        try {
          const payload = createPayload(action, {
            state: 'open',
            title: 'This is a good title for the PR',
            body: 'https://t.co'
          })

          await pullRequest.execute(config({
            body: {
              'contains-url': false,
              'minimum-length': {
                enabled: false
              }
            }
          }), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'failure',
              context: 'zappr/pr/specification',
              description: `PR's body failed check 'contains-issue-number'`
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'failure' if body is ` +
      `equal to PR template and other checks are disabled`, async (done) => {
        try {
          github.readPullRequestTemplate.returns(
            Promise.resolve('Fill in this template'))

          const payload = createPayload(action, {
            state: 'open',
            title: 'This is a good title for the PR',
            body: 'Fill in this template'
          })

          await pullRequest.execute(config({
            body: {
              'minimum-length': {
                enabled: false
              },
              'contains-url': false,
              'contains-issue-number': false,
              'differs-from-pr-template': true
            }
          }), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'failure',
              context: 'zappr/pr/specification',
              description: `PR's body failed check 'differs-from-pr-template'`
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'failure' if cleaned body ` +
      `is equal to cleaned PR template and other checks are disabled`, async (done) => {
        try {
          github.readPullRequestTemplate.returns(
            Promise.resolve('Fix #\n'))

          const payload = createPayload(action, {
            state: 'open',
            title: 'This is a good title for the PR',
            body: 'Fix #'
          })

          await pullRequest.execute(config({
            body: {
              'minimum-length': {
                enabled: false
              },
              'contains-url': false,
              'contains-issue-number': false,
              'differs-from-pr-template': true
            }
          }), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'failure',
              context: 'zappr/pr/specification',
              description: `PR's body failed check 'differs-from-pr-template'`
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })

      it(`[action: '${action}'] should set status to 'failure' if there are ` +
        `no PR template is available and other checks are disabled`, async (done) => {
        try {
          github.readPullRequestTemplate.returns(Promise.reject())

          const payload = createPayload(action, {
            state: 'open',
            title: 'This is a good title for the PR',
            body: 'Issue #42'
          })

          await pullRequest.execute(config({
            body: {
              'minimum-length': {
                enabled: false
              },
              'contains-url': false,
              'contains-issue-number': false,
              'differs-from-pr-template': true
            }
          }), payload, TOKEN)
          expect(github.setCommitStatus.calledWithExactly(
            'sample', 'one', '1a2b3c', {
              state: 'failure',
              context: 'zappr/pr/specification',
              description: `PR's body failed check 'differs-from-pr-template'`
            }, 'token'
          )).to.be.true
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })
})

const createPayload = (action, {title, body, state} = {}) => ({
  action,
  repository: {
    name: 'one',
    full_name: 'sample/one',
    owner: {
      login: 'sample'
    }
  },
  pull_request: {
    body,
    state,
    title,
    number: 1,
    head: {
      sha: '1a2b3c'
    }
  }
})
