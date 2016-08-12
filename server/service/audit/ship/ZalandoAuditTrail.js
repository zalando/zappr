import manageTokens from 'node-tokens'
import { request } from '../../../util'

function getLogger(opts, tokens) {
  return async function log(data) {
    const {id} = data
    delete data.id
    delete data.identity
    const options = {
      method: 'PUT',
      json: true,
      url: `${opts.url}/${id}`,
      body: data,
      headers: {
        'User-Agent': 'zappr',
        'Authorization': `Bearer ${tokens.get('audittrail')}`
      }
    }
    const [resp] = await request(options)
    if (resp.statusCode !== 200) {
      throw new Error(`HTTP Status (${resp.statusCode}) received from Audit API.`)
    }
  }
}

export default function (opts) {
  const tokens = manageTokens({
    audittrail: {scope: ['uid']}
  })
  return getLogger(opts, tokens)
}
