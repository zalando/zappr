const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const AppCachePlugin = require('appcache-webpack-plugin')

module.exports = {
  entry: './client/main.js',
  output: {
    path: path.join(__dirname, 'dist', 'client'),
    filename: 'client.min.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel', query: {
        presets: ['es2015', 'stage-1', 'react']
      }
    }, {
      test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader?minimize')
    }, {
      test: /\.(otf|eot|svg|ttf|woff2?)/, loader: 'file'
    }, {
      test: /\.png$/, loader: 'url-loader?mimetype=image/png'
    }]
  },
  plugins: [
    new ExtractTextPlugin('styles.min.css'),
    new AppCachePlugin({output: 'zappr.appcache'})
  ],
  devServer: {
    proxy: {
      '*': {
        target: 'http://localhost:3000',
        secure: false
      }
    }
  }
}
