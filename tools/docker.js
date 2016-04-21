const fs = require('fs')
const exec = require('child_process').exec
const Docker = require('dockerode')
const tar = require('tar-fs')
const docker = new Docker()

const ZAPPR_SCM_URL = 'https://github.com/zalando/zappr.git'
const ZAPPR_IMAGE = 'registry-write.opensource.zalan.do/opensource/zappr'
const BASE_IMAGE = 'registry.opensource.zalan.do/stups/node:5.10-23'
const VOLUME = '/opt/zappr'

/**
 * Run a shell command.
 *
 * @param {string} command
 * @param {function} callback
 */
function runShell(command, callback) {
  exec(command, (err, stdout) => {
    if (err) callback(err, null)
    else callback(null, stdout.trim())
  })
}

function readGitVersion(callback) {
  runShell('git describe --tags --always', callback)
}

function readGitVersionLong(callback) {
  runShell('git rev-parse HEAD', callback)
}

function readGitAuthor(callback) {
  runShell("git --no-pager show -s --format='%an <%ae>' HEAD", callback)
}

function readGitStatus(callback) {
  runShell('git status --porcelain', callback)
}

/**
 * Write the scm-source.json file.
 *
 * @param {function} callback
 */
function writeScmSourceJson(callback) {
  readGitVersionLong((err, revision) => {
    if (err) return callback(err)

    readGitAuthor((err, author) => {
      if (err) return callback(err)

      readGitStatus((err, status) => {
        if (err) return callback(err)

        const json = {
          url: ZAPPR_SCM_URL,
          revision,
          author,
          status: !status ? '' : 'dirty'
        }
        fs.writeFile('scm-source.json', JSON.stringify(json), err => {
          callback(err)
        })
      })
    })
  })
}

/**
 * Run the npm build from within a Docker container.
 *
 * @param {string} mountDirectory - Local directory to mount inside the container.
 * @param {function} callback
 */
function npmBuild(mountDirectory, callback) {
  if (!mountDirectory) return callback(new Error('mountDirectory not set'))

  docker.run(BASE_IMAGE, ['bash', '-c', 'npm install && npm run dist'], null,
    {
      Volumes: {
        [VOLUME]: {}
      },
      WorkingDir: VOLUME
    },
    (err, data, container) => {
      if (err) return callback(err)

      // Start the container and mount the current working directory.
      container.start({
        'Binds': [`${mountDirectory}:${VOLUME}`]
      }, (err, data) => {
        if (err) console.error('Error:', err)
      })

      // Attach to the container and forward all output.
      container.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
        stream.pipe(process.stdout)
        stream.on('end', () => {
          container.remove((err, data) => {
            callback(err)
          })
        })
      })
    })
}

/**
 * Build a Docker image from the current working directory.
 *
 * @param {string} version - Docker artifact version
 * @param {function} [callback]
 */
function dockerBuild(version, callback) {
  if (!callback) callback = () => null
  const ignore = [
    /node_modules/,
    /test/,
    /tools/,
    /docs/,
    /\.idea/
  ]
  const tarStream = tar.pack(process.cwd(), {
    ignore: name => (ignore.reduce((bool, pattern) => bool || pattern.test(name), false))
  })

  const tag = `${ZAPPR_IMAGE}:${version}`

  docker.buildImage(tarStream, {t: tag}, (err, stream) => {
    if (err) console.error('Error:', err)
    stream.pipe(process.stdout)
    stream.on('end', () => callback())
  })
}

switch (process.argv[2]) {
  case 'dist':
  {
    const mountDirectory = process.env.DOCKER_RUN_WORKING_DIRECTORY || process.argv[3]
    npmBuild(mountDirectory, err => err ? console.error(err) : null)
    break
  }
  case 'build':
    readGitVersion((err, version) =>
      err ? console.error(err) : writeScmSourceJson(err =>
        err ? console.error(err) : dockerBuild(version)))
    break
  default:
    console.error('Usage: docker.js (dist|build)')
}
