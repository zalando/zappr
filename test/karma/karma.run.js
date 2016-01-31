import path from 'path'
import { Server } from 'karma'

import MountebankClient from '../MountebankClient'
const mountebank = new MountebankClient()

const configFile = path.join(__dirname, './karma.conf.js')
const karma = new Server({configFile}, code => {
  console.log('Karma has exited with %d', code)
  // Stop the Mountebank server
  mountebank.stop()
  .then(() => process.exit(code))
  .catch(() => process.exit(1))
})

async function startMountebank() {
  const imposter = {
    port: 4242,
    name: 'zappr'
  }
  try {
    // Configure mountebank imposter
    // @formatter:off
    const mb = await mountebank.start()
    await mb.imposter()
    .setPort(imposter.port)
    .setName(imposter.name)
    .stub()
      .response()
        .setStatusCode(200)
        // Mountebank and Karma are running on different ports
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Content-Type', 'application/json')
        .setBody(require('../fixtures/zappr.repos.json'))
      .add()
      .predicate()
        .setPath('/api/repos')
        .setMethod('GET')
      .add()
    .add()
    .create()
    // @formatter:on
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

// First start the Mountebank server, then Karma
startMountebank().then(() => karma.start())
