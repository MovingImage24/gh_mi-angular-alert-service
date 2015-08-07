'use strict';

module.exports = function (karma) {
  karma.set({

    frameworks: ['jasmine'],

    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/angular-ui-router/release/angular-ui-router.js',
      'src/index.js',
      'test/**/*Spec.js'
    ],

    reporters: ['progress', 'coverage', 'coveralls'],


    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        // reporters not supporting the `file` property
        {type: 'html', subdir: 'html'},
        {type: 'lcov', subdir: '.', file: 'lcov.info'}
      ]
    },
    preprocessors: {
      'test/**/*Spec.js': ['webpack'],
      'src/index.js': ['webpack']
    },

    browsers: ['PhantomJS'],

    logLevel: karma.LOG_INFO,

    singleRun: true,

    webpack: {
      module: {
        postLoaders: [{ // << add subject as webpack's postloader
          test: /\.js$/,
          exclude: /(test|node_modules)\//,
          loader: 'istanbul-instrumenter'
        }]
      }
    }
  });
};