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
  }, {
    'react-dom/server': 'commonjs2 react-dom/server'
  })
)

module.exports = {
  entry: './server/server.js',
  target: 'node',
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'dist', 'server'),
    filename: 'server.min.js'
  },
  module: {
    loaders: [{
      test: /\.jsx$/, exclude: /node_modules/, loader: 'babel', query: {
        presets: ['es2015-node5', 'stage-1', 'react']
      }
    }, {
      test: /\.js$/, exclude: /node_modules/, loader: 'babel', query: {
        presets: ['es2015-node5', 'stage-1']
      }
    }, {
      test: /\.json$/, exclude: /node_modules/, loader: 'json'
    }, {
      test: /\.png$/, loader: 'url-loader?mimetype=image/png'
    }]
  },
  externals: nodeModules()
}
