import { expect } from 'chai'
import Configuration from '../../server/zapprfile/Configuration'

const DEFAULT_CONFIG = {
  commit: {
    message: {
      patterns: ['foo', 'bar']
    }
  }
}

const REPO = {
  json: {
    organization: {
      login: 'zalando'
    }
  }
}

describe('ZapprConfiguration', () => {

  [true, false, 0, -1, 7, Infinity, NaN, undefined, null, []].forEach(throws => {
    it(`should throw if called with ${throws}`, () => {
        expect(() => new Configuration(throws)).to.throw
    })
  })

  it('should NOT ignore user config for some orgs', () => {
    const userConfig = {
      foo: 'bar',
      baz: 'qux',
      pattern: 'plus one'
    }
    const defaultConfig = {
      baz: 'foo',
      pattern: 'thumbs up'
    }
    const ignorePaths = ['baz', 'pattern']
    const notIgnoreWhenRepoInTheseOrgs = ['zalando']
    const config = new Configuration(
      userConfig,
      REPO,
      defaultConfig,
      ignorePaths,
      notIgnoreWhenRepoInTheseOrgs)
    expect(config.getConfiguration()).to.deep.equal(userConfig)
  })

  it('should ignore top-level paths', () => {
    const userConfig = {
      foo: 'bar',
      baz: 'qux',
      pattern: 'plus one'
    }
    const defaultConfig = {
      baz: 'foo',
      pattern: 'thumbs up'
    }
    const ignorePaths = ['baz', 'pattern']
    const notIgnoreWhenRepoInTheseOrgs = []
    const config = new Configuration(
      userConfig,
      REPO,
      defaultConfig,
      ignorePaths,
      notIgnoreWhenRepoInTheseOrgs)
    expect(config.getConfiguration()).to.deep.equal({
      foo: userConfig.foo,
      baz: defaultConfig.baz,
      pattern: defaultConfig.pattern
    })
  })

  it('should ignore nested paths', () => {
    const ignorePaths = ['commit.message', 'approvals.pattern']
    const config = new Configuration({
        approvals: {
          pattern: 'lgtm'
        },
        commit: {
          message: {
            patterns: ['ahhhhhh'],
            willBeIgnoredToo: true,
            furtherNesting: {
              wontHelpEither: true
            }
          }
        }
      },
      REPO,
      DEFAULT_CONFIG,
      ignorePaths)
    expect(config.getConfiguration()).to.deep.equal(Object.assign({approvals: {}}, DEFAULT_CONFIG))
  })

  it('should overwrite arrays correctly', () => {
    const content = 'commit:\n  message:\n    patterns:\n      - baz\n'
    const config = new Configuration(content, REPO, DEFAULT_CONFIG)
    expect(config.isValid()).to.be.true
    const effective = config.getConfiguration()
    expect(effective).to.have.deep.property('commit.message.patterns')
    expect(effective.commit.message.patterns).to.be.an.array
    expect(effective.commit.message.patterns.length).to.equal(1)
    expect(effective.commit.message.patterns[0]).to.equal('baz')
  })

  it('should yield validity correctly', () => {
    const valid = 'foo: "bar"'
    const invalid = 'foo\n  bar:\n    baz'
    expect(new Configuration(valid, REPO, {}).isValid()).to.be.true
    expect(new Configuration(invalid, REPO, {}).isValid()).to.be.false
  })

  it('should hold error message in case of error', () => {
    const invalid = 'foo\n  bar:\n    baz'
    const config = new Configuration(invalid, REPO, {})
    const err = config.getParseError()
    expect(err).to.be.defined
    expect(err).to.be.a.string
    expect(err.length).to.be.above(0)
  })
})
