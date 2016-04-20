import { expect } from 'chai'
import { getIn } from '../../common/util'

describe('common/util', () => {
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
  })
})