(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
function AlertService($rootScope, $timeout, ALERT_LEVELS, $injector) {

  // create an array of alerts available globally
  $rootScope.alerts = [];

  var alertService = {
    add: add,
    closeAlert: closeAlert,
    closeAlertIdx: closeAlertIdx,
    clear: clear
  };

  return alertService;

  ////////////

  function add(type, msg, timeout) {

    if ($injector.has('$translate')) {
      msg = $injector.get('$translate').instant(msg);
    }

    var alert = {
      type: type,
      msg: msg,
      close: function () {
        return alertService.closeAlert(this);
      }
    };

    $rootScope.alerts.push(alert);

    if (timeout === undefined) {
      timeout = (type in ALERT_LEVELS) ? ALERT_LEVELS[type].timeout : 0;
    }

    // error warnings (type 'danger') must not close after timeout,
    // but shall be closed manually
    if (timeout > 0 && alert.type !== 'danger') {
      $timeout(function () {
        alertService.closeAlert(alert);
      }, timeout);
    }
  }

  function closeAlert(alert) {
    return alertService.closeAlertIdx($rootScope.alerts.indexOf(alert));
  }

  function closeAlertIdx(index) {
    return $rootScope.alerts.splice(index, 1);
  }

  function clear() {
    $rootScope.alerts = [];
  }
}

module.exports = AlertService;

},{}],2:[function(require,module,exports){
'use strict';
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
   *
   * example for PATCH Request:
   * 'url', 'PATCH', 'error-translation-key'
   *
   * example for exclude http-status:400 with response error-code:100
   * 'url', 'PATCH', 'error-translation-key', [{status: 400, code: 100, message: 'translation.key}]
   *
   * @param errorUrl
   * @param method
   * @param errorMessage
   */
  function addErrorHandling(errorUrl, method, errorMessage) {

    if ($injector.has('$urlMatcherFactoryProvider') === false) {
      throw new Error('mi.AlertService.ResponseErrorInterceptorProvider:No $urlMatcherFactoryProvider was found. This is a dependency to AngularUI Router.');
    }

    errors.push({
      errorUrl: $injector.get('$urlMatcherFactoryProvider').compile(errorUrl),
      method: method,
      errorMessage: errorMessage
    });
  }

}

module.exports = ResponseErrorInterceptorProvider;

},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
'use strict';

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


},{"./AlertService":1,"./ResponseErrorInterceptor":2,"./StateChangeErrorHandler":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQWxlcnRTZXJ2aWNlLmpzIiwic3JjL1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvci5qcyIsInNyYy9TdGF0ZUNoYW5nZUVycm9ySGFuZGxlci5qcyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuZnVuY3Rpb24gQWxlcnRTZXJ2aWNlKCRyb290U2NvcGUsICR0aW1lb3V0LCBBTEVSVF9MRVZFTFMsICRpbmplY3Rvcikge1xuXG4gIC8vIGNyZWF0ZSBhbiBhcnJheSBvZiBhbGVydHMgYXZhaWxhYmxlIGdsb2JhbGx5XG4gICRyb290U2NvcGUuYWxlcnRzID0gW107XG5cbiAgdmFyIGFsZXJ0U2VydmljZSA9IHtcbiAgICBhZGQ6IGFkZCxcbiAgICBjbG9zZUFsZXJ0OiBjbG9zZUFsZXJ0LFxuICAgIGNsb3NlQWxlcnRJZHg6IGNsb3NlQWxlcnRJZHgsXG4gICAgY2xlYXI6IGNsZWFyXG4gIH07XG5cbiAgcmV0dXJuIGFsZXJ0U2VydmljZTtcblxuICAvLy8vLy8vLy8vLy9cblxuICBmdW5jdGlvbiBhZGQodHlwZSwgbXNnLCB0aW1lb3V0KSB7XG5cbiAgICBpZiAoJGluamVjdG9yLmhhcygnJHRyYW5zbGF0ZScpKSB7XG4gICAgICBtc2cgPSAkaW5qZWN0b3IuZ2V0KCckdHJhbnNsYXRlJykuaW5zdGFudChtc2cpO1xuICAgIH1cblxuICAgIHZhciBhbGVydCA9IHtcbiAgICAgIHR5cGU6IHR5cGUsXG4gICAgICBtc2c6IG1zZyxcbiAgICAgIGNsb3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBhbGVydFNlcnZpY2UuY2xvc2VBbGVydCh0aGlzKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHJvb3RTY29wZS5hbGVydHMucHVzaChhbGVydCk7XG5cbiAgICBpZiAodGltZW91dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aW1lb3V0ID0gKHR5cGUgaW4gQUxFUlRfTEVWRUxTKSA/IEFMRVJUX0xFVkVMU1t0eXBlXS50aW1lb3V0IDogMDtcbiAgICB9XG5cbiAgICAvLyBlcnJvciB3YXJuaW5ncyAodHlwZSAnZGFuZ2VyJykgbXVzdCBub3QgY2xvc2UgYWZ0ZXIgdGltZW91dCxcbiAgICAvLyBidXQgc2hhbGwgYmUgY2xvc2VkIG1hbnVhbGx5XG4gICAgaWYgKHRpbWVvdXQgPiAwICYmIGFsZXJ0LnR5cGUgIT09ICdkYW5nZXInKSB7XG4gICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFsZXJ0U2VydmljZS5jbG9zZUFsZXJ0KGFsZXJ0KTtcbiAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlQWxlcnQoYWxlcnQpIHtcbiAgICByZXR1cm4gYWxlcnRTZXJ2aWNlLmNsb3NlQWxlcnRJZHgoJHJvb3RTY29wZS5hbGVydHMuaW5kZXhPZihhbGVydCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VBbGVydElkeChpbmRleCkge1xuICAgIHJldHVybiAkcm9vdFNjb3BlLmFsZXJ0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgJHJvb3RTY29wZS5hbGVydHMgPSBbXTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFsZXJ0U2VydmljZTtcbiIsIid1c2Ugc3RyaWN0JztcbmZ1bmN0aW9uIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvclByb3ZpZGVyKCRpbmplY3Rvcikge1xuXG4gIHZhciBlcnJvcnMgPSBbXTtcbiAgdmFyIHN0YXRlTmFtZTtcblxuXG5cbiAgdmFyIHByb3ZpZGVyID0ge1xuICAgIGFkZEVycm9ySGFuZGxpbmc6IGFkZEVycm9ySGFuZGxpbmcsXG4gICAgJGdldDogWyckcScsICckcm9vdFNjb3BlJywgJ1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyJywgJ0FsZXJ0U2VydmljZScsXG4gICAgICBmdW5jdGlvbiAoJHEsICRyb290U2NvcGUsIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyLCBBbGVydFNlcnZpY2UpIHtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUpIHtcbiAgICAgICAgICBzdGF0ZU5hbWUgPSB0b1N0YXRlLm5hbWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHN0YXRlTmFtZSA9ICcnO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgUmVzcG9uc2VFcnJvckludGVyY2VwdG9yID0ge1xuICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IHJlc3BvbnNlRXJyb3JcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gUmVzcG9uc2VFcnJvckludGVyY2VwdG9yO1xuXG4gICAgICAgIC8vLy8vLy9cblxuICAgICAgICBmdW5jdGlvbiByZXNwb25zZUVycm9yKGVycm9yKSB7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGVycm9ycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKGlzRXJyb3JWYWxpZGF0b3IoZXJyb3JzW2ldLCBlcnJvcikpIHtcbiAgICAgICAgICAgICAgdmFyIGVyck1lc3NhZ2UgPSBlcnJvcnNbaV0uZXJyb3JNZXNzYWdlO1xuXG4gICAgICAgICAgICAgIGlmIChlcnJNZXNzYWdlICE9PSBudWxsICYmIHR5cGVvZiBlcnJNZXNzYWdlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGVyck1lc3NhZ2UgPSBnZXRDdXN0b21FcnJvck1lc3NhZ2UoZXJyb3JzW2ldLCBlcnJvcik7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBBbGVydFNlcnZpY2UuYWRkKCdkYW5nZXInLCBlcnJNZXNzYWdlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuICRxLnJlamVjdChlcnJvcik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBpc0Vycm9yVmFsaWRhdG9yKGVycm9yVmFsaWRhdG9yLCBlcnJvcikge1xuICAgICAgICAgIHJldHVybiBtYXRjaFVybChlcnJvclZhbGlkYXRvciwgZXJyb3IuY29uZmlnKSAmJlxuICAgICAgICAgICAgZXJyb3IuY29uZmlnLm1ldGhvZCA9PT0gZXJyb3JWYWxpZGF0b3IubWV0aG9kICYmXG4gICAgICAgICAgICBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlci5oYXNTdGF0ZUVycm9yKHN0YXRlTmFtZSkgPT09IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q3VzdG9tRXJyb3JNZXNzYWdlKHZhbGlkYXRvciwgZXJyb3IpIHtcbiAgICAgICAgICB2YXIgZXJyb3JEYXRhID0gZXJyb3IuZGF0YTtcbiAgICAgICAgICB2YXIgY3VzdG9tRXJyb3JNZXNzYWdlcyA9IHZhbGlkYXRvci5lcnJvck1lc3NhZ2UuY3VzdG9tO1xuXG4gICAgICAgICAgaWYgKGN1c3RvbUVycm9yTWVzc2FnZXMgJiYgY3VzdG9tRXJyb3JNZXNzYWdlcy5sZW5ndGggPiAwICYmIGVycm9yRGF0YSAmJiBlcnJvckRhdGEuY29kZSkge1xuICAgICAgICAgICAgdmFyIGZpbHRlckxlbmd0aCA9IGN1c3RvbUVycm9yTWVzc2FnZXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICB2YXIgZmlsdGVyID0gY3VzdG9tRXJyb3JNZXNzYWdlc1tpXTtcbiAgICAgICAgICAgICAgaWYgKGZpbHRlci5zdGF0dXMgPT09IGVycm9yLnN0YXR1cyAmJiBmaWx0ZXIuY29kZSA9PT0gZXJyb3JEYXRhLmNvZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyLm1lc3NhZ2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmVycm9yTWVzc2FnZS5kZWZhdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gbWF0Y2hVcmwodmFsaWRhdG9yLCBjb25maWcpIHtcbiAgICAgICAgICBpZiAoIXZhbGlkYXRvciB8fCAhY29uZmlnIHx8ICFjb25maWcudXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIG1hdGNoUmVzdWx0ID0gdmFsaWRhdG9yLmVycm9yVXJsLmV4ZWMoY29uZmlnLnVybCwgY29uZmlnLnBhcmFtcyk7XG4gICAgICAgICAgaWYgKG1hdGNoUmVzdWx0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gbWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgICAgICAgaWYgKG1hdGNoUmVzdWx0W2tleV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfV1cbiAgfTtcblxuICByZXR1cm4gcHJvdmlkZXI7XG5cbiAgLy8vLy8vLy9cblxuICAvKipcbiAgICpcbiAgICogZXhhbXBsZSBmb3IgUEFUQ0ggUmVxdWVzdDpcbiAgICogJ3VybCcsICdQQVRDSCcsICdlcnJvci10cmFuc2xhdGlvbi1rZXknXG4gICAqXG4gICAqIGV4YW1wbGUgZm9yIGV4Y2x1ZGUgaHR0cC1zdGF0dXM6NDAwIHdpdGggcmVzcG9uc2UgZXJyb3ItY29kZToxMDBcbiAgICogJ3VybCcsICdQQVRDSCcsICdlcnJvci10cmFuc2xhdGlvbi1rZXknLCBbe3N0YXR1czogNDAwLCBjb2RlOiAxMDAsIG1lc3NhZ2U6ICd0cmFuc2xhdGlvbi5rZXl9XVxuICAgKlxuICAgKiBAcGFyYW0gZXJyb3JVcmxcbiAgICogQHBhcmFtIG1ldGhvZFxuICAgKiBAcGFyYW0gZXJyb3JNZXNzYWdlXG4gICAqL1xuICBmdW5jdGlvbiBhZGRFcnJvckhhbmRsaW5nKGVycm9yVXJsLCBtZXRob2QsIGVycm9yTWVzc2FnZSkge1xuXG4gICAgaWYgKCRpbmplY3Rvci5oYXMoJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJykgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pLkFsZXJ0U2VydmljZS5SZXNwb25zZUVycm9ySW50ZXJjZXB0b3JQcm92aWRlcjpObyAkdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlciB3YXMgZm91bmQuIFRoaXMgaXMgYSBkZXBlbmRlbmN5IHRvIEFuZ3VsYXJVSSBSb3V0ZXIuJyk7XG4gICAgfVxuXG4gICAgZXJyb3JzLnB1c2goe1xuICAgICAgZXJyb3JVcmw6ICRpbmplY3Rvci5nZXQoJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJykuY29tcGlsZShlcnJvclVybCksXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIGVycm9yTWVzc2FnZTogZXJyb3JNZXNzYWdlXG4gICAgfSk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvclByb3ZpZGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuZnVuY3Rpb24gU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXJQcm92aWRlcigkaW5qZWN0b3IpIHtcblxuICB2YXIgZXJyb3JTdGF0ZXMgPSBbXTtcblxuICB2YXIgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXJQcm92aWRlciA9IHtcbiAgICBhZGRFcnJvckhhbmRsaW5nOiBhZGRFcnJvckhhbmRsaW5nLFxuICAgICRnZXQ6IFsnJHJvb3RTY29wZScsICckaW5qZWN0b3InLCAnQWxlcnRTZXJ2aWNlJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRpbmplY3RvciwgQWxlcnRTZXJ2aWNlKSB7XG5cbiAgICAgIHZhciBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlciA9IHtcbiAgICAgICAgaW5pdDogaW5pdCxcbiAgICAgICAgaGFzU3RhdGVFcnJvcjogaGFzU3RhdGVFcnJvclxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyO1xuXG4gICAgICAvLy8vLy8vXG5cbiAgICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VFcnJvcicsIHN0YXRlQ2hhbmdlRXJyb3IpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBoYXNTdGF0ZUVycm9yKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBlcnJvclN0YXRlcy5zb21lKGZ1bmN0aW9uIChlcnJvclN0YXRlKSB7XG4gICAgICAgICAgcmV0dXJuIGVycm9yU3RhdGUuc3RhdGUgPT09IHN0YXRlO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gc3RhdGVDaGFuZ2VFcnJvcihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcywgZXJyb3IpIHtcbiAgICAgICAgZXJyb3JTdGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoZXJyb3JTdGF0ZSkge1xuICAgICAgICAgIGlmICh0b1N0YXRlLm5hbWUgPT09IGVycm9yU3RhdGUuc3RhdGUgJiYgZXJyb3IuY29uZmlnICYmIGVycm9yLmNvbmZpZy51cmwgJiZcbiAgICAgICAgICAgIGVycm9yU3RhdGUuZXJyb3JVcmwuZXhlYyhlcnJvci5jb25maWcudXJsKSAmJiBlcnJvci5jb25maWcubWV0aG9kID09PSBlcnJvclN0YXRlLm1ldGhvZCkge1xuICAgICAgICAgICAgQWxlcnRTZXJ2aWNlLmFkZCgnZGFuZ2VyJywgZXJyb3JTdGF0ZS5lcnJvck1lc3NhZ2UpO1xuXG4gICAgICAgICAgICBpZiAoZXJyb3JTdGF0ZS5oYW5kbGVNZXRob2QpIHtcbiAgICAgICAgICAgICAgJGluamVjdG9yLmludm9rZShlcnJvclN0YXRlLmhhbmRsZU1ldGhvZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XVxuICB9O1xuXG4gIHJldHVybiBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyO1xuXG4gIC8vLy8vLy8vXG5cbiAgZnVuY3Rpb24gYWRkRXJyb3JIYW5kbGluZyhzdGF0ZSwgZXJyb3JVcmwsIG1ldGhvZCwgZXJyb3JNZXNzYWdlLCBoYW5kbGVNZXRob2QpIHtcblxuICAgIGlmICgkaW5qZWN0b3IuaGFzKCckdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlcicpID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaS5BbGVydFNlcnZpY2UuU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXJQcm92aWRlcjpObyAkdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlciB3YXMgZm91bmQuIFRoaXMgaXMgYSBkZXBlbmRlbmN5IHRvIEFuZ3VsYXJVSSBSb3V0ZXIuJyk7XG4gICAgfVxuXG4gICAgZXJyb3JTdGF0ZXMucHVzaCh7XG4gICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICBlcnJvclVybDogJGluamVjdG9yLmdldCgnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKS5jb21waWxlKGVycm9yVXJsKSxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgZXJyb3JNZXNzYWdlOiBlcnJvck1lc3NhZ2UsXG4gICAgICBoYW5kbGVNZXRob2Q6IGhhbmRsZU1ldGhvZFxuICAgIH0pO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEFsZXJ0U2VydmljZSA9IHJlcXVpcmUoJy4vQWxlcnRTZXJ2aWNlJyksXG4gICAgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIgPSByZXF1aXJlKCcuL1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyJyksXG4gICAgUmVzcG9uc2VFcnJvckludGVyY2VwdG9yID0gcmVxdWlyZSgnLi9SZXNwb25zZUVycm9ySW50ZXJjZXB0b3InKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyXG4gIC5tb2R1bGUoJ21pLkFsZXJ0U2VydmljZScsIFtdKVxuXG4gIC5wcm92aWRlcignU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXInLCBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcilcbiAgLnByb3ZpZGVyKCdSZXNwb25zZUVycm9ySW50ZXJjZXB0b3InLCBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3IpXG5cbiAgLnNlcnZpY2UoJ0FsZXJ0U2VydmljZScsIEFsZXJ0U2VydmljZSlcbiAgLmNvbnN0YW50KCdBTEVSVF9MRVZFTFMnLCB7XG4gICAgZGFuZ2VyOiB7dGltZW91dDogNTAwMH0sXG4gICAgd2FybmluZzoge3RpbWVvdXQ6IDQwMDB9LFxuICAgIHN1Y2Nlc3M6IHt0aW1lb3V0OiAzMDAwfSxcbiAgICBpbmZvOiB7dGltZW91dDogMjAwMH1cbiAgfSlcbjtcblxuIl19
