import { Transport } from 'winston'
import { request } from '../../util'
import manageTokens from 'node-tokens'

const tokens = manageTokens({
  audittrail: {scope: ['uid']}
})

export default class ZalandoAuditTrail extends Transport {
  constructor(opts) {
    super(opts)
    this.url = opts.url
  }

  log(level, msg, meta, cb = x => x) {
    const {id} = meta
    delete meta.id
    return request({
      method: 'PUT',
      json: true,
      url: `${this.url}/${id}`,
      body: meta,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.get('audittrail')}`
      }
    })
    .then(resp => cb(null, resp))
    .catch(console.error.bind(console))
  }
}
