const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  entry: './client/main.js',
  output: {
    path: path.join(__dirname, 'dist', 'client'),
    filename: 'client.min.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel', query: {
        presets: ['es2015', 'stage-1', 'react'],
        plugins: ['transform-runtime']
      }
    }, {
      test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader?minimize')
    }, {
      test: /\.(otf|eot|svg|ttf|woff2?)/, loader: 'file'
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Zapp',
      template: './client/index.html',
      minify: {
        collapseWhitespace: true,
        preserveLineBreaks: true
      }
    }),
    new ExtractTextPlugin('styles.min.css')
  ]
}
