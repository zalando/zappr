const PREFIX = 'zappr'

/**
 * Create a new debug logger.
 *
 * @param name {string} Name of the logger
 * @param debug {[object]} Optional debug instance
 */
export function logger(name, debug=null) {
  return (debug || require('debug'))(`${PREFIX}:${name}`)
}

export function bind(parent) {
  parent['DEBUG'] = require('debug')
  return (name => logger(name, parent['DEBUG']))
}
