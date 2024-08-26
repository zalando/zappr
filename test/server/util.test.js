import { expect } from 'chai'
import {jsonHash, setRequestDoer, request} from '../../server/util'
import { util } from 'chai/lib/chai';
import nconf from '../../server/nconf'

describe('server/util', () => {
  describe('jsonHash', () => {
    it('should hash an object', () => {
      const input = {approval: '😍'}
      expect(jsonHash(input)).to.equal('a1e5345e22fb40487c724595a9251a22aaf5ff820dee77e1a5222279115ed4d1')
    })
  })
  describe('request', function() {
    this.timeout(20000);

    it('make only one call if successfull', async(done) => {
      try {
        var numRequests = 0

        // Setup stub request doer
        setRequestDoer((resolve, reject, ...args) => {
          numRequests = numRequests + 1
          resolve([{ statusCode: 200 }, "OK"])
        })

        const [response, body] = await request({
          method: 'GET',
          url: 'a/b/c',
        })
        
        expect(numRequests).to.equal(1)
        expect(response.statusCode).to.equal(200)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('retry request till successfull when max retry delay is not reached', async(done) => {
      try {
        var numFailures = 4
        var numRequests = 0
        
        // Setup stub request doer
        setRequestDoer((resolve, reject, ...args) => {
          numRequests = numRequests + 1

          if (numFailures > 0) {
            numFailures = numFailures - 1
            resolve([{ statusCode: 500 }, "retry me" ])
          } else {
            resolve([{ statusCode: 200 }, "OK"])
          }
        })

        const [response, body] = await request({
          method: 'GET',
          url: 'a/b/c',
        })
        
        expect(numRequests).to.equal(5)
        expect(response.statusCode).to.equal(200)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('retry request till max retry delay is reached', async(done) => {
      try {
        // Keep failing, should stop after failing 8 times
        var numFailures = 10
        var numRequests = 0
        
        // Setup stub request doer
        setRequestDoer((resolve, reject, ...args) => {
          numRequests = numRequests + 1

          if (numFailures > 0) {
            numFailures = numFailures - 1
            resolve([{ statusCode: 500 }, "retry me" ])
          } else {
            resolve([{ statusCode: 200 }, "OK"])
          }
        })

        const [response, body] = await request({
          method: 'GET',
          url: 'a/b/c',
        })
        
        // Should make exactly 8 requests and stop
        // First call, then after 150ms, 300ms, 600ms, 1200ms, 2400ms, 4800ms and finally 9600ms
        expect(numRequests).to.equal(8)
        expect(response.statusCode).to.equal(500)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('not retry non-recoverable errors', async(done) => {
      // 4xx errors are permanent errors (client request related), it should not retry
      try {
        var numRequests = 0
        
        // Setup stub request doer
        setRequestDoer((resolve, reject, ...args) => {
          numRequests = numRequests + 1
          resolve([{ statusCode: 403 }, "don't retry me" ])
        })

        const [response, body] = await request({
          method: 'GET',
          url: 'a/b/c',
        })
        
        expect(numRequests).to.equal(1)
        expect(response.statusCode).to.equal(403)
        done()
      } catch (e) {
        done(e)
      }
    })

    it('backoff exponentially', async (done) => {
      try {
        var numRequests = 0
        var lastRequestTime = new Date().getTime()
        const delayMap = [ 0, 150, 300, 600, 1200, 2400, 4800, 9600, 19200 ]
        
        // Setup stub request doer
        setRequestDoer((resolve, reject, ...args) => {
          let expectedDelay = delayMap[numRequests]
          let actualDelay = new Date().getTime() - lastRequestTime

          numRequests = numRequests + 1
          lastRequestTime = new Date().getTime()

          // actual delay should equal to or not more than 100ms greater than the expected delay
          if (actualDelay == expectedDelay || actualDelay <= (expectedDelay + 50)) {
            resolve([{ statusCode: 500 }, "retry me" ])
          } else {
            reject(new Error(`Expected a delay of ${expectedDelay} (+/- 50ms), actual delay: ${actualDelay}`));
          }
        })

        const [response, body] = await request({
          method: 'GET',
          url: 'a/b/c',
        })
        
        expect(numRequests).to.equal(8)
        expect(response.statusCode).to.equal(500)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
