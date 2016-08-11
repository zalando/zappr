import winston, { Logger } from 'winston'

export default function (opts) {
  return new Logger().add(winston.transports.file, opts).info
}
