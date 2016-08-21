import nconf from 'nconf'
import yaml from 'js-yaml'
import fs from 'fs'
import { logger } from '../common/debug'

const debug = logger('nconf')

/**
 * Return the first file in the list that can be read.
 *
 * @param {Array.<string>} files
 */
function readFirstFile(files) {
  for (let file of files) {
    try {
      return fs.readFileSync(file, 'utf8')
    } catch (e) {
      debug('Could not read file %s', file)
    }
  }
}

/**
 * Read a YAML file and return an object.
 *
 * @param {string|Array.<string>} file
 * @returns {object}
 */
function readYamlFile(file) {
  if (Array.isArray(file))
    return yaml.safeLoad(readFirstFile(file))
  else
    return yaml.safeLoad(fs.readFileSync(file, 'utf8'))
}

/**
 * Initialized nconf instance.
 *
 * Other modules can either directly import nconf or this module.
 * However only this module ensures that nconf is properly
 * configured when it is imported for the first time.
 */
export default nconf.use('memory')
                    .argv()
                    .env()
                    .add('config', {
                      type: 'literal',
                      store: readYamlFile('./config/config.yaml')
                    })
