import { expect } from 'chai'
import { getIn, setDifference } from '../../common/util'

describe('common/util', () => {
  describe('setDifference', () => {
    it('should calculate the difference of two sets', () => {
      const set1 = new Set([1, 2, 3, 4, 5])
      const set2 = new Set([3, 4, 5, 6, 7])
      const diff = setDifference(set1, set2)
      expect(diff.size).to.equal(2)
      expect([...diff]).to.deep.equal([1, 2])
    })
    it('should return the first set if there is no second', () => {
      const set1 = new Set(["foo", "bar"])
      const diff = setDifference(set1)
      expect(diff).to.equal(set1)
    })
    it('should return an empty set if nothing is provided', () => {
      const diff = setDifference()
      expect(diff instanceof Set).to.be.true
      expect(diff.size).to.equal(0)
    })
  })

  describe('getIn', () => {
    const obj = {
      commit: {
        message: {
          patterns: ['foo']
        }
      }
    }

    it('should return deep property', () => {
      expect(getIn(obj, ['commit', 'message', 'patterns'])).to.deep.equal(obj.commit.message.patterns)
    })

    it('should return default value if path does not exist', () => {
      expect(getIn(obj, ['commit', 'bar', 'patterns'], false)).to.be.false
    })

    it('should work when path is not an array', () => {
      const thing = getIn(obj, 'commit', false)
      expect(thing).to.not.be.false
      expect(thing).to.deep.equal({
        message: {
          patterns: ['foo']
        }
      })
    })

    it('should work on arrays', () => {
      expect(getIn([1], 0, false)).to.not.be.false
      expect(getIn([1], 0, false)).to.equal(1)
    })
  })
})
