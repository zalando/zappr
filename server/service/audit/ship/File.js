import winston, { Logger } from 'winston'

export default function (opts) {
  const logger = new Logger()
  logger.add(winston.transports.File, opts)
  return logger.info.bind(logger)
}
