'use strict';

module.exports = function(karma) {
  karma.set({

    frameworks: [ 'jasmine', 'browserify' ],

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
        { type: 'html', subdir: 'html' },
        { type: 'lcov', subdir: '.', file: 'lcov.info' }
      ],

      file: 'cobertura-coverage.xml'
    },
    preprocessors: {
      'test/**/*Spec.js': [ 'browserify'],
      'src/index.js': [ 'browserify']
    },

    browsers: [ 'PhantomJS' ],

    logLevel: karma.LOG_INFO,

    singleRun: true,

    // browserify configuration
    browserify: {
      debug: true,
      transform: ['browserify-ngannotate', 'browserify-istanbul']
    }
  });
};