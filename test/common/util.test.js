import { expect } from 'chai'
import { getIn, promiseReduce, promiseFirst } from '../../common/util'

describe('common/util', () => {

  describe('promiseReduce', () => {
    it('should async build a sum over an array', done => {
      const numbers = [1, 2, 3, 4, 5]
      const reducer = (sum, item) => new Promise(resolve => setTimeout(() => resolve(sum + item), 50))
      promiseReduce(numbers, reducer, 5)
      .then(sum => {
        expect(sum).to.equal(20)
        done()
      })
      .catch(done)
    })
  })

  describe('promiseFirst', () => {
    it('should reject if all reject', done => {
      const promises = [Promise.reject(1), Promise.reject(2)]
      promiseFirst(promises)
      .then(() => {
        done(1)
      })
      .catch(e => {
        done()
      })
    })
    it('should return the first resolving promise', done => {
      const promises = [Promise.reject(1), Promise.resolve(2)]
      promiseFirst(promises)
      .then(x => {
        expect(x).to.equal(2)
        done()
      })
      .catch(done)
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
