import nconf from 'nconf'
import yaml from 'js-yaml'
import fs from 'fs'

nconf
  .use('memory')
  .argv()
  .env()
  .defaults(yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8')))

export default nconf
