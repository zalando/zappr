import supertest from 'supertest-as-promised'
import { expect } from 'chai'

import initMetrics from '../../server/metrics'

describe('Metrics', () => {
  let request
  let app

  before(() => {
    app = initMetrics()
    request = supertest.agent(app.listen())
  })

  describe('GET /metrics', () => {
    it('should output text', async(done) => {
      try {
        const result = await request.get('/metrics').expect(200)
        expect(result.text.length).to.be.above(0)
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
