import fs from 'fs'
import AuditService from './AuditService'

const DEFAULT_FILENAME = 'audit.log'

export default class FileAuditService extends AuditService {
  constructor(opts = {}) {
    super(opts)
    const {filename = DEFAULT_FILENAME} = opts
    this.stream = fs.createWriteStream(filename, {flags: 'a'})
    this.stream.on('error', console.log.bind(console))
  }

  async ship(body) {
    const logLine = `${body.timestamp}: ${JSON.stringify(body)}\n`
    this.stream.write(logLine, 'utf8')
  }
}

