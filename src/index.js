'use strict';
/**
 * @ngInject
 */
var AlertService = require('./AlertService'),
    StateChangeErrorHandler = require('./StateChangeErrorHandler'),
    ResponseErrorInterceptor = require('./ResponseErrorInterceptor');

module.exports = angular
  .module('mi.AlertService', [])

  .provider('StateChangeErrorHandler', StateChangeErrorHandler)
  .provider('ResponseErrorInterceptor', ResponseErrorInterceptor)

  .service('AlertService', AlertService)
  .constant('ALERT_LEVELS', {
    danger: {timeout: 5000},
    warning: {timeout: 4000},
    success: {timeout: 3000},
    info: {timeout: 2000}
  })
;

