var ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
var webpack = require('webpack');

module.exports = {
  devtool: 'inline-source-map',
  plugins: [
    new ngAnnotatePlugin({add: true}),
    //new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin()
  ]
}
