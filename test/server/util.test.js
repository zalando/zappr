import { expect } from 'chai'
import {jsonHash} from '../../server/util'

describe('server/util', () => {
  describe('jsonHash', () => {
    it('should hash an object', () => {
      const input = {approval: '😍'}
      expect(jsonHash(input)).to.equal('a1e5345e22fb40487c724595a9251a22aaf5ff820dee77e1a5222279115ed4d1')
    })
  })
})
