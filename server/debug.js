const PREFIX = 'zappr'

/**
 * Create a new debug logger.
 *
 * @param name {string} - Name of the logger
 */
export function logger(name) {
  return require('debug')(`${PREFIX}:${name}`)
}
