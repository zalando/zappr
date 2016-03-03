const PREFIX = 'zappr'
const LEVEL = 'info'
const LEVELS = ['trace', 'debug', 'info', 'warn', 'error']

function noop() {}

function shouldLog(loglevel) {
  return LEVELS.indexOf(loglevel) >= LEVELS.indexOf(LEVEL)
}

function padLeading(digit, number, totalLength) {
  let strNumber = number.toString()
  if (strNumber.length >= totalLength) {
    return strNumber
  }
  let padding = totalLength - strNumber.length
  while(padding) {
    strNumber = digit + strNumber
    padding -= 1
  }
  return strNumber
}

export function formatDate(date) {
  let year = date.getUTCFullYear()
  let month = date.getUTCMonth() + 1
  let day = date.getUTCDate()
  let hour = date.getUTCHours()
  let minute = date.getUTCMinutes()
  let second = date.getUTCSeconds()

  month = padLeading(0, month, 2)
  day = padLeading(0, day, 2)
  hour = padLeading(0, hour, 2)
  minute = padLeading(0, minute, 2)
  second = padLeading(0, second, 2)
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
}

/**
 * Create a new debug logger.
 *
 * @param name {string} Name of the logger
 * @param loglevel {string} Desired loglevel, default debug
 */
export function logger(name, loglevel='debug', parent = null) {
  const inst = (parent || require('debug'))(`${PREFIX}:${name}:${loglevel}`)
  function actualLogger() {
    const args = [formatDate(new Date())].concat(Array.from(arguments))
    inst.apply(inst, args)
  }
  return shouldLog(loglevel) ? actualLogger : noop
}

export function bind(parent, loglevel='debug') {
  parent['DEBUG'] = require('debug')
  return (name => logger(name, loglevel, parent['DEBUG']))
}

