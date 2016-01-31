const path = require('path')
const webpack = require('webpack')
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  entry: {
    client: './client/main.js',
    vendor: [
      'react',
      'react-dom'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist', 'client'),
    filename: '1-client.min.js'
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
    new CommonsChunkPlugin('vendor', '0-vendor.min.js'),
    new webpack.DefinePlugin({
      ZAPPR_HOST: "''" // leave empty to use the domain of the server
    })
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
