import { db, FrozenComment } from '../../server/model'
import { expect } from 'chai'

describe("FrozenComment", () => {
  before(async(done) => {
    try {
      // Initialize database
      await db.createSchemas()
      await db._sync()
      done()
    } catch (e) {
      done(e)
    }
  })

  beforeEach(done => Promise.all([
    FrozenComment.truncate({cascade: true})
  ]).then(() => done()).catch(done))

  it("should not store comments with unsafe IDs")
  it("should convert ID to string on load")
  it("should store comments with safe IDs")
})
