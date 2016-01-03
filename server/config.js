import nconf from 'nconf'
import yaml from 'js-yaml'
import fs from 'fs'

export default nconf
  .argv()
  .env()
  .defaults(yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8')))
