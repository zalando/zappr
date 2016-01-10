import nconf from 'nconf'
import yaml from 'js-yaml'
import fs from 'fs'

/**
 * Initialized nconf instance.
 *
 * Other modules can either directly import nconf or this module.
 * However only this module ensures that nconf is properly
 * configured when it is imported for the first time.
 */
export default nconf
  .use('memory')
  .argv()
  .env()
  .defaults(yaml.safeLoad(fs.readFileSync('./config.yml', 'utf8')))
