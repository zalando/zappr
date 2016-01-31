const fs = require('fs')
const webpack = require('webpack')

module.exports = function (config) {
  config.set({
    urlRoot: '/karma/',
    browsers: ['Chrome'],
    singleRun: true, // set false for debugging
    frameworks: ['mocha'],
    files: [
      'tests.webpack.js'
    ],
    preprocessors: {
      'tests.webpack.js': ['webpack', 'sourcemap']
    },
    reporters: ['mocha'],
    webpack: {
      module: {
        loaders: [{
          test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel', query: {
            presets: ['es2015', 'stage-1', 'react']
          }
        }, {
          test: /\.css$/, loader: 'style!css'
        }, {
          test: /\.(otf|eot|svg|ttf|woff2?)/, loader: 'url?limit=100000'
        }, {
          test: /\.png$/, loader: 'url?mimetype=image/png'
        }]
      },
      plugins: [
        new webpack.DefinePlugin({
          ZAPPR_HOST: "'http://localhost:4242'" // use mountebank imposter
        })
      ]
    },
    webpackServer: {
      noInfo: true
    },
    devtool: 'inline-source-map'
  })
}
