'use strict';

/**
 * @ngInject
 */
function ResponseErrorInterceptorProvider($injector) {

  var errors = [];
  var stateName;



  var provider = {
    addErrorHandling: addErrorHandling,
    $get: ['$q', '$rootScope', 'StateChangeErrorHandler', 'AlertService',
      function ($q, $rootScope, StateChangeErrorHandler, AlertService) {

        $rootScope.$on('$stateChangeStart', function (event, toState) {
          stateName = toState.name;
        });

        $rootScope.$on('$stateChangeSuccess', function () {
          stateName = '';
        });

        var ResponseErrorInterceptor = {
          responseError: responseError
        };

        return ResponseErrorInterceptor;

        ///////

        function responseError(error) {
          for (var i = 0, len = errors.length; i < len; i++) {
            if (isErrorValidator(errors[i], error)) {
              var errMessage = errors[i].errorMessage;

              if (errMessage !== null && typeof errMessage === 'object') {
                errMessage = getCustomErrorMessage(errors[i], error);
              }

              AlertService.add('danger', errMessage);
              break;
            }
          }

          return $q.reject(error);
        }

        function isErrorValidator(errorValidator, error) {
          return matchUrl(errorValidator, error.config) &&
            error.config.method === errorValidator.method &&
            validateExclude(errorValidator.exclude, error.status) &&
            StateChangeErrorHandler.hasStateError(stateName) === false;
        }

        function getCustomErrorMessage(validator, error) {
          var errorData = error.data;
          var customErrorMessages = validator.errorMessage.custom;

          if (customErrorMessages && customErrorMessages.length > 0 && errorData && errorData.code) {
            var filterLength = customErrorMessages.length;
            for (var i = 0; i < filterLength; i++) {
              var filter = customErrorMessages[i];
              if (filter.status === error.status && filter.code === errorData.code) {
                return filter.message;
              }
            }
          }

          return validator.errorMessage.default;
        }

        /**
         * @param {Object=} exclude
         * @param {number} statusCode
         *
         * @returns {boolean}
         */
        function validateExclude(exclude, statusCode) {
          if (!angular.isObject(exclude) || !angular.isArray(exclude.statusCodes) || exclude.statusCodes.length === 0) {
            return true;
          }

          return exclude.statusCodes.indexOf(statusCode) === -1;
        }

        function matchUrl(validator, config) {
          if (!validator || !config || !config.url) {
            return false;
          }

          var matchResult = validator.errorUrl.exec(config.url, config.params);
          if (matchResult) {
            for (var key in matchResult) {
              if (matchResult[key] === undefined) {
                return false;
              }
            }
            return true;
          }
          return false;
        }
      }]
  };

  return provider;

  ////////

  /**
   * example for PATCH Request:
   * 'url', 'PATCH', 'error-translation-key'
   *
   * example for exclude http-status:400 with response error-code:100
   * 'url', 'PATCH', {custom: [{status: 400,code: 100,message: 'my custom error message'}], default: 'error default'}
   *
   * example for exclude some status codes
   * 'url', 'PATCH', 'error-translation-key', {statusCodes: [400, 401, 402, 403]}
   *
   * @param {string} errorUrl
   * @param {string} method
   * @param {string|Object} errorMessage
   * @param {Object=} exclude
   */
  function addErrorHandling(errorUrl, method, errorMessage, exclude) {

    if ($injector.has('$urlMatcherFactoryProvider') === false) {
      throw new Error('mi.AlertService.ResponseErrorInterceptorProvider:No $urlMatcherFactoryProvider was found. This is a dependency to AngularUI Router.');
    }

    errors.push({
      errorUrl: $injector.get('$urlMatcherFactoryProvider').compile(errorUrl),
      method: method,
      errorMessage: errorMessage,
      exclude: exclude
    });
  }

}

module.exports = ResponseErrorInterceptorProvider;
