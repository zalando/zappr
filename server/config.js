import nconf from 'nconf'

export const config = nconf.
argv().
env().
defaults(require('../config.json'))
