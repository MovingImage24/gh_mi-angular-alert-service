/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * @ngInject
	 */
	var AlertService = __webpack_require__(1),
	    StateChangeErrorHandler = __webpack_require__(3),
	    ResponseErrorInterceptor = __webpack_require__(2);

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



/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * @ngInject
	 */
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

	    if (timeout > 0) {
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
	AlertService.$inject = ["$rootScope", "$timeout", "ALERT_LEVELS", "$injector"];

	module.exports = AlertService;


/***/ },
/* 2 */
/***/ function(module, exports) {

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
	            validateInclude(errorValidator.include, error.status) &&
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

	        function validateInclude(include, statusCode) {
	          if (!angular.isObject(include) || !angular.isArray(include.statusCodes) || include.statusCodes.length === 0) {
	            return true;
	          }

	          return include.statusCodes.indexOf(statusCode) !== -1;
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
	  function addErrorHandling(errorUrl, method, errorMessage, exclude, include) {

	    if ($injector.has('$urlMatcherFactoryProvider') === false) {
	      throw new Error('mi.AlertService.ResponseErrorInterceptorProvider:No $urlMatcherFactoryProvider was found. This is a dependency to AngularUI Router.');
	    }

	    errors.push({
	      errorUrl: $injector.get('$urlMatcherFactoryProvider').compile(errorUrl),
	      method: method,
	      errorMessage: errorMessage,
	      exclude: exclude,
	      include: include
	    });
	  }

	}
	ResponseErrorInterceptorProvider.$inject = ["$injector"];

	module.exports = ResponseErrorInterceptorProvider;


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	/**
	 * @ngInject
	 */
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
	StateChangeErrorHandlerProvider.$inject = ["$injector"];

	module.exports = StateChangeErrorHandlerProvider;

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMmNlZDM1NjE4MmJlNTIyOTI4ZmUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9BbGVydFNlcnZpY2UuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUN0Q0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYSxjQUFjO0FBQzNCLGVBQWMsY0FBYztBQUM1QixlQUFjLGNBQWM7QUFDNUIsWUFBVztBQUNYLElBQUc7QUFDSDs7Ozs7Ozs7QUN0QkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7O0FDN0RBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFVBQVM7O0FBRVQ7QUFDQTtBQUNBLFVBQVM7O0FBRVQ7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0Esd0NBQXVEO0FBQ3ZEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSw0QkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsWUFBMkI7QUFDM0Isb0JBQW1CLE9BQU87QUFDMUI7QUFDQSxXQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBc0IsVUFBVSxxQ0FBeUQ7QUFDekY7QUFDQTtBQUNBLDJDQUErQztBQUMvQztBQUNBLEtBQW9CO0FBQ3BCLGNBQWEsT0FBTztBQUNwQixjQUFhLGNBQWM7QUFDM0IsY0FBYSxRQUFRO0FBQ3JCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDs7QUFFQTs7QUFFQTs7Ozs7OztBQ3RKQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0EsTUFBSztBQUNMOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7O0FBRUE7O0FBRUEsRSIsImZpbGUiOiJtaS1hbmd1bGFyLWFsZXJ0LXNlcnZpY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDJjZWQzNTYxODJiZTUyMjkyOGZlXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ0luamVjdFxuICovXG52YXIgQWxlcnRTZXJ2aWNlID0gcmVxdWlyZSgnLi9BbGVydFNlcnZpY2UnKSxcbiAgICBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlciA9IHJlcXVpcmUoJy4vU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXInKSxcbiAgICBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3IgPSByZXF1aXJlKCcuL1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXJcbiAgLm1vZHVsZSgnbWkuQWxlcnRTZXJ2aWNlJywgW10pXG5cbiAgLnByb3ZpZGVyKCdTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcicsIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyKVxuICAucHJvdmlkZXIoJ1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcicsIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcilcblxuICAuc2VydmljZSgnQWxlcnRTZXJ2aWNlJywgQWxlcnRTZXJ2aWNlKVxuICAuY29uc3RhbnQoJ0FMRVJUX0xFVkVMUycsIHtcbiAgICBkYW5nZXI6IHt0aW1lb3V0OiA1MDAwfSxcbiAgICB3YXJuaW5nOiB7dGltZW91dDogNDAwMH0sXG4gICAgc3VjY2Vzczoge3RpbWVvdXQ6IDMwMDB9LFxuICAgIGluZm86IHt0aW1lb3V0OiAyMDAwfVxuICB9KVxuO1xuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ0luamVjdFxuICovXG5mdW5jdGlvbiBBbGVydFNlcnZpY2UoJHJvb3RTY29wZSwgJHRpbWVvdXQsIEFMRVJUX0xFVkVMUywgJGluamVjdG9yKSB7XG5cbiAgLy8gY3JlYXRlIGFuIGFycmF5IG9mIGFsZXJ0cyBhdmFpbGFibGUgZ2xvYmFsbHlcbiAgJHJvb3RTY29wZS5hbGVydHMgPSBbXTtcblxuICB2YXIgYWxlcnRTZXJ2aWNlID0ge1xuICAgIGFkZDogYWRkLFxuICAgIGNsb3NlQWxlcnQ6IGNsb3NlQWxlcnQsXG4gICAgY2xvc2VBbGVydElkeDogY2xvc2VBbGVydElkeCxcbiAgICBjbGVhcjogY2xlYXJcbiAgfTtcblxuICByZXR1cm4gYWxlcnRTZXJ2aWNlO1xuXG4gIC8vLy8vLy8vLy8vL1xuXG4gIGZ1bmN0aW9uIGFkZCh0eXBlLCBtc2csIHRpbWVvdXQpIHtcblxuICAgIGlmICgkaW5qZWN0b3IuaGFzKCckdHJhbnNsYXRlJykpIHtcbiAgICAgIG1zZyA9ICRpbmplY3Rvci5nZXQoJyR0cmFuc2xhdGUnKS5pbnN0YW50KG1zZyk7XG4gICAgfVxuXG4gICAgdmFyIGFsZXJ0ID0ge1xuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIG1zZzogbXNnLFxuICAgICAgY2xvc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFsZXJ0U2VydmljZS5jbG9zZUFsZXJ0KHRoaXMpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkcm9vdFNjb3BlLmFsZXJ0cy5wdXNoKGFsZXJ0KTtcblxuICAgIGlmICh0aW1lb3V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVvdXQgPSAodHlwZSBpbiBBTEVSVF9MRVZFTFMpID8gQUxFUlRfTEVWRUxTW3R5cGVdLnRpbWVvdXQgOiAwO1xuICAgIH1cblxuICAgIGlmICh0aW1lb3V0ID4gMCkge1xuICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBhbGVydFNlcnZpY2UuY2xvc2VBbGVydChhbGVydCk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZUFsZXJ0KGFsZXJ0KSB7XG4gICAgcmV0dXJuIGFsZXJ0U2VydmljZS5jbG9zZUFsZXJ0SWR4KCRyb290U2NvcGUuYWxlcnRzLmluZGV4T2YoYWxlcnQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlQWxlcnRJZHgoaW5kZXgpIHtcbiAgICByZXR1cm4gJHJvb3RTY29wZS5hbGVydHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICRyb290U2NvcGUuYWxlcnRzID0gW107XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBbGVydFNlcnZpY2U7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL0FsZXJ0U2VydmljZS5qc1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmdJbmplY3RcbiAqL1xuZnVuY3Rpb24gUmVzcG9uc2VFcnJvckludGVyY2VwdG9yUHJvdmlkZXIoJGluamVjdG9yKSB7XG5cbiAgdmFyIGVycm9ycyA9IFtdO1xuICB2YXIgc3RhdGVOYW1lO1xuXG4gIHZhciBwcm92aWRlciA9IHtcbiAgICBhZGRFcnJvckhhbmRsaW5nOiBhZGRFcnJvckhhbmRsaW5nLFxuICAgICRnZXQ6IFsnJHEnLCAnJHJvb3RTY29wZScsICdTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcicsICdBbGVydFNlcnZpY2UnLFxuICAgICAgZnVuY3Rpb24gKCRxLCAkcm9vdFNjb3BlLCBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlciwgQWxlcnRTZXJ2aWNlKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlKSB7XG4gICAgICAgICAgc3RhdGVOYW1lID0gdG9TdGF0ZS5uYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzdGF0ZU5hbWUgPSAnJztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvciA9IHtcbiAgICAgICAgICByZXNwb25zZUVycm9yOiByZXNwb25zZUVycm9yXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcjtcblxuICAgICAgICAvLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gcmVzcG9uc2VFcnJvcihlcnJvcikge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBlcnJvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpc0Vycm9yVmFsaWRhdG9yKGVycm9yc1tpXSwgZXJyb3IpKSB7XG4gICAgICAgICAgICAgIHZhciBlcnJNZXNzYWdlID0gZXJyb3JzW2ldLmVycm9yTWVzc2FnZTtcblxuICAgICAgICAgICAgICBpZiAoZXJyTWVzc2FnZSAhPT0gbnVsbCAmJiB0eXBlb2YgZXJyTWVzc2FnZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBlcnJNZXNzYWdlID0gZ2V0Q3VzdG9tRXJyb3JNZXNzYWdlKGVycm9yc1tpXSwgZXJyb3IpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgQWxlcnRTZXJ2aWNlLmFkZCgnZGFuZ2VyJywgZXJyTWVzc2FnZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNFcnJvclZhbGlkYXRvcihlcnJvclZhbGlkYXRvciwgZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gbWF0Y2hVcmwoZXJyb3JWYWxpZGF0b3IsIGVycm9yLmNvbmZpZykgJiZcbiAgICAgICAgICAgIGVycm9yLmNvbmZpZy5tZXRob2QgPT09IGVycm9yVmFsaWRhdG9yLm1ldGhvZCAmJlxuICAgICAgICAgICAgdmFsaWRhdGVFeGNsdWRlKGVycm9yVmFsaWRhdG9yLmV4Y2x1ZGUsIGVycm9yLnN0YXR1cykgJiZcbiAgICAgICAgICAgIHZhbGlkYXRlSW5jbHVkZShlcnJvclZhbGlkYXRvci5pbmNsdWRlLCBlcnJvci5zdGF0dXMpICYmXG4gICAgICAgICAgICBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlci5oYXNTdGF0ZUVycm9yKHN0YXRlTmFtZSkgPT09IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Q3VzdG9tRXJyb3JNZXNzYWdlKHZhbGlkYXRvciwgZXJyb3IpIHtcbiAgICAgICAgICB2YXIgZXJyb3JEYXRhID0gZXJyb3IuZGF0YTtcbiAgICAgICAgICB2YXIgY3VzdG9tRXJyb3JNZXNzYWdlcyA9IHZhbGlkYXRvci5lcnJvck1lc3NhZ2UuY3VzdG9tO1xuXG4gICAgICAgICAgaWYgKGN1c3RvbUVycm9yTWVzc2FnZXMgJiYgY3VzdG9tRXJyb3JNZXNzYWdlcy5sZW5ndGggPiAwICYmIGVycm9yRGF0YSAmJiBlcnJvckRhdGEuY29kZSkge1xuICAgICAgICAgICAgdmFyIGZpbHRlckxlbmd0aCA9IGN1c3RvbUVycm9yTWVzc2FnZXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICB2YXIgZmlsdGVyID0gY3VzdG9tRXJyb3JNZXNzYWdlc1tpXTtcbiAgICAgICAgICAgICAgaWYgKGZpbHRlci5zdGF0dXMgPT09IGVycm9yLnN0YXR1cyAmJiBmaWx0ZXIuY29kZSA9PT0gZXJyb3JEYXRhLmNvZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyLm1lc3NhZ2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdmFsaWRhdG9yLmVycm9yTWVzc2FnZS5kZWZhdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gZXhjbHVkZVxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RhdHVzQ29kZVxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHZhbGlkYXRlRXhjbHVkZShleGNsdWRlLCBzdGF0dXNDb2RlKSB7XG4gICAgICAgICAgaWYgKCFhbmd1bGFyLmlzT2JqZWN0KGV4Y2x1ZGUpIHx8ICFhbmd1bGFyLmlzQXJyYXkoZXhjbHVkZS5zdGF0dXNDb2RlcykgfHwgZXhjbHVkZS5zdGF0dXNDb2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBleGNsdWRlLnN0YXR1c0NvZGVzLmluZGV4T2Yoc3RhdHVzQ29kZSkgPT09IC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdmFsaWRhdGVJbmNsdWRlKGluY2x1ZGUsIHN0YXR1c0NvZGUpIHtcbiAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNPYmplY3QoaW5jbHVkZSkgfHwgIWFuZ3VsYXIuaXNBcnJheShpbmNsdWRlLnN0YXR1c0NvZGVzKSB8fCBpbmNsdWRlLnN0YXR1c0NvZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGluY2x1ZGUuc3RhdHVzQ29kZXMuaW5kZXhPZihzdGF0dXNDb2RlKSAhPT0gLTE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBtYXRjaFVybCh2YWxpZGF0b3IsIGNvbmZpZykge1xuICAgICAgICAgIGlmICghdmFsaWRhdG9yIHx8ICFjb25maWcgfHwgIWNvbmZpZy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgbWF0Y2hSZXN1bHQgPSB2YWxpZGF0b3IuZXJyb3JVcmwuZXhlYyhjb25maWcudXJsLCBjb25maWcucGFyYW1zKTtcbiAgICAgICAgICBpZiAobWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgICBpZiAobWF0Y2hSZXN1bHRba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XVxuICB9O1xuXG4gIHJldHVybiBwcm92aWRlcjtcblxuICAvLy8vLy8vL1xuXG4gIC8qKlxuICAgKiBleGFtcGxlIGZvciBQQVRDSCBSZXF1ZXN0OlxuICAgKiAndXJsJywgJ1BBVENIJywgJ2Vycm9yLXRyYW5zbGF0aW9uLWtleSdcbiAgICpcbiAgICogZXhhbXBsZSBmb3IgZXhjbHVkZSBodHRwLXN0YXR1czo0MDAgd2l0aCByZXNwb25zZSBlcnJvci1jb2RlOjEwMFxuICAgKiAndXJsJywgJ1BBVENIJywge2N1c3RvbTogW3tzdGF0dXM6IDQwMCxjb2RlOiAxMDAsbWVzc2FnZTogJ215IGN1c3RvbSBlcnJvciBtZXNzYWdlJ31dLCBkZWZhdWx0OiAnZXJyb3IgZGVmYXVsdCd9XG4gICAqXG4gICAqIGV4YW1wbGUgZm9yIGV4Y2x1ZGUgc29tZSBzdGF0dXMgY29kZXNcbiAgICogJ3VybCcsICdQQVRDSCcsICdlcnJvci10cmFuc2xhdGlvbi1rZXknLCB7c3RhdHVzQ29kZXM6IFs0MDAsIDQwMSwgNDAyLCA0MDNdfVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXJyb3JVcmxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZFxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9IGVycm9yTWVzc2FnZVxuICAgKiBAcGFyYW0ge09iamVjdD19IGV4Y2x1ZGVcbiAgICovXG4gIGZ1bmN0aW9uIGFkZEVycm9ySGFuZGxpbmcoZXJyb3JVcmwsIG1ldGhvZCwgZXJyb3JNZXNzYWdlLCBleGNsdWRlLCBpbmNsdWRlKSB7XG5cbiAgICBpZiAoJGluamVjdG9yLmhhcygnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWkuQWxlcnRTZXJ2aWNlLlJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvclByb3ZpZGVyOk5vICR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyIHdhcyBmb3VuZC4gVGhpcyBpcyBhIGRlcGVuZGVuY3kgdG8gQW5ndWxhclVJIFJvdXRlci4nKTtcbiAgICB9XG5cbiAgICBlcnJvcnMucHVzaCh7XG4gICAgICBlcnJvclVybDogJGluamVjdG9yLmdldCgnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKS5jb21waWxlKGVycm9yVXJsKSxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgZXJyb3JNZXNzYWdlOiBlcnJvck1lc3NhZ2UsXG4gICAgICBleGNsdWRlOiBleGNsdWRlLFxuICAgICAgaW5jbHVkZTogaW5jbHVkZVxuICAgIH0pO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3JQcm92aWRlcjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvUmVzcG9uc2VFcnJvckludGVyY2VwdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ0luamVjdFxuICovXG5mdW5jdGlvbiBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyKCRpbmplY3Rvcikge1xuXG4gIHZhciBlcnJvclN0YXRlcyA9IFtdO1xuXG4gIHZhciBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyID0ge1xuICAgIGFkZEVycm9ySGFuZGxpbmc6IGFkZEVycm9ySGFuZGxpbmcsXG4gICAgJGdldDogWyckcm9vdFNjb3BlJywgJyRpbmplY3RvcicsICdBbGVydFNlcnZpY2UnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJGluamVjdG9yLCBBbGVydFNlcnZpY2UpIHtcblxuICAgICAgdmFyIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyID0ge1xuICAgICAgICBpbml0OiBpbml0LFxuICAgICAgICBoYXNTdGF0ZUVycm9yOiBoYXNTdGF0ZUVycm9yXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXI7XG5cbiAgICAgIC8vLy8vLy9cblxuICAgICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZUVycm9yJywgc3RhdGVDaGFuZ2VFcnJvcik7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGhhc1N0YXRlRXJyb3Ioc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIGVycm9yU3RhdGVzLnNvbWUoZnVuY3Rpb24gKGVycm9yU3RhdGUpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3JTdGF0ZS5zdGF0ZSA9PT0gc3RhdGU7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzdGF0ZUNoYW5nZUVycm9yKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zLCBlcnJvcikge1xuICAgICAgICBlcnJvclN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChlcnJvclN0YXRlKSB7XG4gICAgICAgICAgaWYgKHRvU3RhdGUubmFtZSA9PT0gZXJyb3JTdGF0ZS5zdGF0ZSAmJiBlcnJvci5jb25maWcgJiYgZXJyb3IuY29uZmlnLnVybCAmJlxuICAgICAgICAgICAgZXJyb3JTdGF0ZS5lcnJvclVybC5leGVjKGVycm9yLmNvbmZpZy51cmwpICYmIGVycm9yLmNvbmZpZy5tZXRob2QgPT09IGVycm9yU3RhdGUubWV0aG9kKSB7XG4gICAgICAgICAgICBBbGVydFNlcnZpY2UuYWRkKCdkYW5nZXInLCBlcnJvclN0YXRlLmVycm9yTWVzc2FnZSk7XG5cbiAgICAgICAgICAgIGlmIChlcnJvclN0YXRlLmhhbmRsZU1ldGhvZCkge1xuICAgICAgICAgICAgICAkaW5qZWN0b3IuaW52b2tlKGVycm9yU3RhdGUuaGFuZGxlTWV0aG9kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1dXG4gIH07XG5cbiAgcmV0dXJuIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXI7XG5cbiAgLy8vLy8vLy9cblxuICBmdW5jdGlvbiBhZGRFcnJvckhhbmRsaW5nKHN0YXRlLCBlcnJvclVybCwgbWV0aG9kLCBlcnJvck1lc3NhZ2UsIGhhbmRsZU1ldGhvZCkge1xuXG4gICAgaWYgKCRpbmplY3Rvci5oYXMoJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJykgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pLkFsZXJ0U2VydmljZS5TdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyOk5vICR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyIHdhcyBmb3VuZC4gVGhpcyBpcyBhIGRlcGVuZGVuY3kgdG8gQW5ndWxhclVJIFJvdXRlci4nKTtcbiAgICB9XG5cbiAgICBlcnJvclN0YXRlcy5wdXNoKHtcbiAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgIGVycm9yVXJsOiAkaW5qZWN0b3IuZ2V0KCckdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlcicpLmNvbXBpbGUoZXJyb3JVcmwpLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICBlcnJvck1lc3NhZ2U6IGVycm9yTWVzc2FnZSxcbiAgICAgIGhhbmRsZU1ldGhvZDogaGFuZGxlTWV0aG9kXG4gICAgfSk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXI7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9TdGF0ZUNoYW5nZUVycm9ySGFuZGxlci5qc1xuICoqIG1vZHVsZSBpZCA9IDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=