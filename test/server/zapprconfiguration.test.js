import { expect } from 'chai'
import Configuration from '../../server/zapprfile/Configuration'

const DEFAULT_CONFIG = {
  commit: {
    message: {
      patterns: ['foo', 'bar']
    }
  }
}

describe('zapprfile', () => {

  it('should overwrite arrays correctly', () => {
    const content = 'commit:\n  message:\n    patterns:\n      - baz\n'
    const config = new Configuration(content, DEFAULT_CONFIG)
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
    expect(new Configuration(valid, {}).isValid()).to.be.true
    expect(new Configuration(invalid, {}).isValid()).to.be.false
  })

  it('should hold error message in case of error', () => {
    const invalid = 'foo\n  bar:\n    baz'
    const config = new Configuration(invalid, {})
    const err = config.getParseError()
    expect(err).to.be.defined
    expect(err).to.be.a.string
    expect(err.length).to.be.above(0)
  })
})
