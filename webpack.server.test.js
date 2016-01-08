/**
 * Webpack configuration for the webpack-loaders babel plugin
 * that is used during testing.
 */
module.exports = {
  output: {
    libraryTarget: 'commonjs2'
  },
  module: {
    loaders: [{
      test: /\.png$/, loader: 'url-loader?mimetype=image/png'
    }]
  }
}
