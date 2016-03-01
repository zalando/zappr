import temp from 'temp'
import rimraf from 'rimraf'
import {request} from '../common/util'
import mountebank from 'mountebank'

import { logger } from '../common/debug'
const log = logger('test')

const defaultOptions = {
  port: 2525,
  logfile: temp.path({suffix: '.log'}),
  loglevel: 'warn',
  mock: true
}

export default class MountebankClient {
  constructor(options = {}) {
    this.options = {...defaultOptions, ...options}
    this.url = `http://localhost:${this.options.port}`
    this.shutdown = () => {
      log('mb server not running')
      return Promise.resolve(this)
    }
  }

  start() {
    log('starting mb server...')
    return mountebank.create(this.options).then(server => {
      log(`mb listening on port ${this.options.port}`)
      this.shutdown = () => new Promise(resolve =>
        server.close(resolve)
      )
      return this
    })
  }

  // removes all imposters and adds them again
  async reset() {
    var configs = {}
    let [resp, imposters] = await request({method: 'GET', json: true, url: this.url + '/imposters'})
    await Promise.all(imposters.imposters.map(async imp => {
      let [resp, imposter] = await request({method: 'GET', json: true, url: imp['_links'].self.href})
      configs[imp.port] = {
        stubs: imposter.stubs,
        name: imposter.name,
        port: imposter.port,
        protocol: imposter.protocol
      }
      return request({method: 'DELETE', url: imp['_links'].self.href})
    }))
    return Promise.all(Object.keys(configs).map(port => {
      let body = configs[port]
      return request({method: 'POST', json: true, url: `${this.url}/imposters`, body})
    }))
  }

  calls(imposterPort) {
    const url = `${this.url}/imposters/${imposterPort}`
    return request({method: 'GET', url, json: true})
            .then(([resp, body]) => body.requests)
  }

  stop() {
    return this.shutdown().
    then(() => log('stopped mb server')).
    then(() => new Promise((resolve, reject) =>
      rimraf(this.options.logfile, {}, err => err ? reject(err) : resolve())
    ))
  }

  imposter(port = null, protocol = 'http', name = null) {
    const url = `http://localhost:${this.options.port}`
    return new Imposter(port, protocol, name, url)
  }
}

class Imposter {
  constructor(port, protocol, name, url, stubs = []) {
    this.data = {port, protocol, name, stubs}
    this.url = url
  }

  setPort(port) {
    this.data.port = port
    return this
  }

  setProtocol(protocol) {
    this.data.protocol = protocol
    return this
  }

  setName(name) {
    this.data.name = name
    return this
  }

  stub() {
    return new Stub(stub => {
      this.data.stubs.push(stub)
      return this
    })
  }

  async create() {
    const url = `${this.url}/imposters`
    const body = this.data
    const [resp, respBody] = await request({method: 'POST', url, body, json: true})
    return respBody
  }
}

class Addable {
  constructor(onAdd) {
    this.onAdd = onAdd
  }

  add() {
    return this.onAdd(this.data)
  }
}

class Stub extends Addable {
  constructor(onAdd, responses = [], predicates = []) {
    super(onAdd)
    this.onAdd = onAdd
    this.data = {responses, predicates}
  }

  response(type = 'is') {
    return new Response(type, response => {
      this.data.responses.push(response)
      return this
    })
  }

  predicate(type = 'equals') {
    return new Predicate(type, predicate => {
      this.data.predicates.push(predicate)
      return this
    })
  }
}

class Response extends Addable {
  constructor(type, onAdd, statusCode = null, headers = {}, body = null) {
    super(onAdd)
    this.content = {statusCode, headers, body}
    this.data = {}
    this.data[type] = this.content
  }

  setStatusCode(statusCode) {
    this.content.statusCode = statusCode
    return this
  }

  setHeader(key, value) {
    this.content.headers[key] = value
    return this
  }

  setBody(body) {
    if (typeof body === 'object') {
      this.content.body = JSON.stringify(body)
    } else {
      this.content.body = body
    }
    return this
  }
}

class Predicate extends Addable {
  constructor(type, onAdd, path = null, method = null) {
    super(onAdd)
    this.content = {path, method}
    this.data = {}
    this.data[type] = this.content
  }

  setPath(path) {
    this.content.path = path
    return this
  }

  setMethod(method) {
    this.content.method = method
    return this
  }
}
