const fs = require('fs')
const path = require('path')
const nconf = require('nconf')
const yaml = require('js-yaml')
const webpack = require('webpack')
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

nconf.env()
     .defaults(yaml.safeLoad(fs.readFileSync('./config/config.yaml', 'utf8')))

module.exports = {
  entry: {
    client: ['babel-polyfill', './client/main.js'],
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
    rules: [{
      test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader', query: {
        presets: ['es2015', 'stage-1', 'react']
      }
    }, {
      test: /\.css$/, loader: ExtractTextPlugin.extract({fallback:'style-loader', use:'css-loader'})
    }, {
      test: /\.(otf|eot|svg|ttf|woff2?)/, loader: 'file-loader'
    }, {
      test: /\.png$/, loader: 'url-loader?mimetype=image/png'
    },
      {
        test: /\.css$/,
        loader:"postcss-loader"
      }]
  },
  plugins: [
    new ExtractTextPlugin('styles.min.css'),
    new CommonsChunkPlugin({name:'vendor', filename:'0-vendor.min.js'}),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(nconf.get('NODE_ENV')),
      'process.env.LOG_LEVEL': JSON.stringify(nconf.get('LOG_LEVEL')),
      'HOST_ADDR': "''" // always use the the relative server path
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
