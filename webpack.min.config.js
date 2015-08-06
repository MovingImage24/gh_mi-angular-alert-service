var ngAnnotatePlugin = require('ng-annotate-webpack-plugin');

module.exports = {
  plugins: [
    new ngAnnotatePlugin({
      add: true,
    })
  ]
}