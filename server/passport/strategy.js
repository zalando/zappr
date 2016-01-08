import config from '../config'

/**
 * Return the test passport strategy or the actual strategy.
 */
export default function getStrategy() {
  switch (config.get('NODE_ENV')) {
    case 'test':
      return require('../../test/passport/MockStrategy').default
    default:
      return require('passport-github2')
  }
}
