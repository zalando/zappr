const path = require('path')
const fs = require('fs')

/**
 * Externalize node_modules.
 */
const nodeModules = () => (
  fs.readdirSync('node_modules').
  filter(x => ['.bin'].indexOf(x) === -1).
  reduce((modules, m) => {
    modules[m] = 'commonjs2 ' + m
    return modules
  }, {})
)

module.exports = {
  entry: './server/server.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist', 'server'),
    filename: 'server.min.js'
  },
  module: {
    loaders: [{
      test: /\.js$/, exclude: /node_modules/, loader: 'babel?presets[]=node5'
    }, {
      test: /\.json$/, exclude: /node_modules/, loader: 'json'
    }]
  },
  externals: nodeModules()
}
