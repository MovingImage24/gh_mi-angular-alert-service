'use strict';
function StateChangeErrorHandlerProvider($injector) {

  var errorStates = [];

  var StateChangeErrorHandlerProvider = {
    addErrorHandling: addErrorHandling,
    $get: ['$rootScope', '$injector', 'AlertService', function ($rootScope, $injector, AlertService) {

      var StateChangeErrorHandler = {
        init: init,
        hasStateError: hasStateError
      };

      return StateChangeErrorHandler;

      ///////

      function init() {
        $rootScope.$on('$stateChangeError', stateChangeError);
      }

      function hasStateError(state) {
        return errorStates.some(function (errorState) {
          return errorState.state === state;
        });
      }

      function stateChangeError(event, toState, toParams, fromState, fromParams, error) {
        errorStates.forEach(function (errorState) {
          if (toState.name === errorState.state && error.config && error.config.url &&
            errorState.errorUrl.exec(error.config.url) && error.config.method === errorState.method) {
            AlertService.add('danger', errorState.errorMessage);

            if (errorState.handleMethod) {
              $injector.invoke(errorState.handleMethod);
            }
          }
        });
      }
    }]
  };

  return StateChangeErrorHandlerProvider;

  ////////

  function addErrorHandling(state, errorUrl, method, errorMessage, handleMethod) {

    if ($injector.has('$urlMatcherFactoryProvider') === false) {
      throw new Error('mi.AlertService.StateChangeErrorHandlerProvider:No $urlMatcherFactoryProvider was found. This is a dependency to AngularUI Router.');
    }

    errorStates.push({
      state: state,
      errorUrl: $injector.get('$urlMatcherFactoryProvider').compile(errorUrl),
      method: method,
      errorMessage: errorMessage,
      handleMethod: handleMethod
    });
  }

}

module.exports = StateChangeErrorHandlerProvider;