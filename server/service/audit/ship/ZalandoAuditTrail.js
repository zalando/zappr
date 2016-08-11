import { Logger, Transport } from 'winston'
import manageTokens from 'node-tokens'
import { request } from '../../../util'

class ZalandoAuditTrail extends Transport {
  constructor(opts) {
    super(opts)
    this.url = opts.url
    this.tokens = manageTokens({
      audittrail: {scope: ['uid']}
    })
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
        'Authorization': `Bearer ${this.tokens.get('audittrail')}`
      }
    })
    .then(resp => cb(null, resp))
    .catch(console.error.bind(console))
  }
}

export default function (opts) {
  return new Logger().add(ZalandoAuditTrail, opts).info
}
