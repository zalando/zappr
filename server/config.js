import nconf from 'nconf'

export default nconf
  .argv()
  .env()
  .defaults(require('../config.json'))
