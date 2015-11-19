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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNGEzOTc1MTNhNjdjNzU5MjM4MjEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9BbGVydFNlcnZpY2UuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFhLGNBQWM7QUFDM0IsZUFBYyxjQUFjO0FBQzVCLGVBQWMsY0FBYztBQUM1QixZQUFXO0FBQ1gsSUFBRztBQUNIOzs7Ozs7OztBQ3JCQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFFBQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7QUM3REE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxVQUFTOztBQUVUO0FBQ0E7QUFDQSxVQUFTOztBQUVUO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBLHdDQUF1RDtBQUN2RDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDRCQUEyQixrQkFBa0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxZQUEyQjtBQUMzQixvQkFBbUIsT0FBTztBQUMxQjtBQUNBLFdBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBc0IsVUFBVSxxQ0FBeUQ7QUFDekY7QUFDQTtBQUNBLDJDQUErQztBQUMvQztBQUNBLEtBQW9CO0FBQ3BCLGNBQWEsT0FBTztBQUNwQixjQUFhLGNBQWM7QUFDM0IsY0FBYSxRQUFRO0FBQ3JCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7O0FBRUE7O0FBRUE7Ozs7Ozs7QUM5SUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDtBQUNBLE1BQUs7QUFDTDs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMOztBQUVBOztBQUVBLEUiLCJmaWxlIjoibWktYW5ndWxhci1hbGVydC1zZXJ2aWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCA0YTM5NzUxM2E2N2M3NTkyMzgyMVxuICoqLyIsIid1c2Ugc3RyaWN0Jztcbi8qKlxuICogQG5nSW5qZWN0XG4gKi9cbnZhciBBbGVydFNlcnZpY2UgPSByZXF1aXJlKCcuL0FsZXJ0U2VydmljZScpLFxuICAgIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyID0gcmVxdWlyZSgnLi9TdGF0ZUNoYW5nZUVycm9ySGFuZGxlcicpLFxuICAgIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvciA9IHJlcXVpcmUoJy4vUmVzcG9uc2VFcnJvckludGVyY2VwdG9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhclxuICAubW9kdWxlKCdtaS5BbGVydFNlcnZpY2UnLCBbXSlcblxuICAucHJvdmlkZXIoJ1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyJywgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIpXG4gIC5wcm92aWRlcignUmVzcG9uc2VFcnJvckludGVyY2VwdG9yJywgUmVzcG9uc2VFcnJvckludGVyY2VwdG9yKVxuXG4gIC5zZXJ2aWNlKCdBbGVydFNlcnZpY2UnLCBBbGVydFNlcnZpY2UpXG4gIC5jb25zdGFudCgnQUxFUlRfTEVWRUxTJywge1xuICAgIGRhbmdlcjoge3RpbWVvdXQ6IDUwMDB9LFxuICAgIHdhcm5pbmc6IHt0aW1lb3V0OiA0MDAwfSxcbiAgICBzdWNjZXNzOiB7dGltZW91dDogMzAwMH0sXG4gICAgaW5mbzoge3RpbWVvdXQ6IDIwMDB9XG4gIH0pXG47XG5cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nSW5qZWN0XG4gKi9cbmZ1bmN0aW9uIEFsZXJ0U2VydmljZSgkcm9vdFNjb3BlLCAkdGltZW91dCwgQUxFUlRfTEVWRUxTLCAkaW5qZWN0b3IpIHtcblxuICAvLyBjcmVhdGUgYW4gYXJyYXkgb2YgYWxlcnRzIGF2YWlsYWJsZSBnbG9iYWxseVxuICAkcm9vdFNjb3BlLmFsZXJ0cyA9IFtdO1xuXG4gIHZhciBhbGVydFNlcnZpY2UgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgY2xvc2VBbGVydDogY2xvc2VBbGVydCxcbiAgICBjbG9zZUFsZXJ0SWR4OiBjbG9zZUFsZXJ0SWR4LFxuICAgIGNsZWFyOiBjbGVhclxuICB9O1xuXG4gIHJldHVybiBhbGVydFNlcnZpY2U7XG5cbiAgLy8vLy8vLy8vLy8vXG5cbiAgZnVuY3Rpb24gYWRkKHR5cGUsIG1zZywgdGltZW91dCkge1xuXG4gICAgaWYgKCRpbmplY3Rvci5oYXMoJyR0cmFuc2xhdGUnKSkge1xuICAgICAgbXNnID0gJGluamVjdG9yLmdldCgnJHRyYW5zbGF0ZScpLmluc3RhbnQobXNnKTtcbiAgICB9XG5cbiAgICB2YXIgYWxlcnQgPSB7XG4gICAgICB0eXBlOiB0eXBlLFxuICAgICAgbXNnOiBtc2csXG4gICAgICBjbG9zZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYWxlcnRTZXJ2aWNlLmNsb3NlQWxlcnQodGhpcyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRyb290U2NvcGUuYWxlcnRzLnB1c2goYWxlcnQpO1xuXG4gICAgaWYgKHRpbWVvdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGltZW91dCA9ICh0eXBlIGluIEFMRVJUX0xFVkVMUykgPyBBTEVSVF9MRVZFTFNbdHlwZV0udGltZW91dCA6IDA7XG4gICAgfVxuXG4gICAgaWYgKHRpbWVvdXQgPiAwKSB7XG4gICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFsZXJ0U2VydmljZS5jbG9zZUFsZXJ0KGFsZXJ0KTtcbiAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlQWxlcnQoYWxlcnQpIHtcbiAgICByZXR1cm4gYWxlcnRTZXJ2aWNlLmNsb3NlQWxlcnRJZHgoJHJvb3RTY29wZS5hbGVydHMuaW5kZXhPZihhbGVydCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VBbGVydElkeChpbmRleCkge1xuICAgIHJldHVybiAkcm9vdFNjb3BlLmFsZXJ0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgJHJvb3RTY29wZS5hbGVydHMgPSBbXTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFsZXJ0U2VydmljZTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvQWxlcnRTZXJ2aWNlLmpzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ0luamVjdFxuICovXG5mdW5jdGlvbiBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3JQcm92aWRlcigkaW5qZWN0b3IpIHtcblxuICB2YXIgZXJyb3JzID0gW107XG4gIHZhciBzdGF0ZU5hbWU7XG5cblxuXG4gIHZhciBwcm92aWRlciA9IHtcbiAgICBhZGRFcnJvckhhbmRsaW5nOiBhZGRFcnJvckhhbmRsaW5nLFxuICAgICRnZXQ6IFsnJHEnLCAnJHJvb3RTY29wZScsICdTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcicsICdBbGVydFNlcnZpY2UnLFxuICAgICAgZnVuY3Rpb24gKCRxLCAkcm9vdFNjb3BlLCBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlciwgQWxlcnRTZXJ2aWNlKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlKSB7XG4gICAgICAgICAgc3RhdGVOYW1lID0gdG9TdGF0ZS5uYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzdGF0ZU5hbWUgPSAnJztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvciA9IHtcbiAgICAgICAgICByZXNwb25zZUVycm9yOiByZXNwb25zZUVycm9yXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcjtcblxuICAgICAgICAvLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gcmVzcG9uc2VFcnJvcihlcnJvcikge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBlcnJvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpc0Vycm9yVmFsaWRhdG9yKGVycm9yc1tpXSwgZXJyb3IpKSB7XG4gICAgICAgICAgICAgIHZhciBlcnJNZXNzYWdlID0gZXJyb3JzW2ldLmVycm9yTWVzc2FnZTtcblxuICAgICAgICAgICAgICBpZiAoZXJyTWVzc2FnZSAhPT0gbnVsbCAmJiB0eXBlb2YgZXJyTWVzc2FnZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBlcnJNZXNzYWdlID0gZ2V0Q3VzdG9tRXJyb3JNZXNzYWdlKGVycm9yc1tpXSwgZXJyb3IpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgQWxlcnRTZXJ2aWNlLmFkZCgnZGFuZ2VyJywgZXJyTWVzc2FnZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNFcnJvclZhbGlkYXRvcihlcnJvclZhbGlkYXRvciwgZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gbWF0Y2hVcmwoZXJyb3JWYWxpZGF0b3IsIGVycm9yLmNvbmZpZykgJiZcbiAgICAgICAgICAgIGVycm9yLmNvbmZpZy5tZXRob2QgPT09IGVycm9yVmFsaWRhdG9yLm1ldGhvZCAmJlxuICAgICAgICAgICAgdmFsaWRhdGVFeGNsdWRlKGVycm9yVmFsaWRhdG9yLmV4Y2x1ZGUsIGVycm9yLnN0YXR1cykgJiZcbiAgICAgICAgICAgIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyLmhhc1N0YXRlRXJyb3Ioc3RhdGVOYW1lKSA9PT0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDdXN0b21FcnJvck1lc3NhZ2UodmFsaWRhdG9yLCBlcnJvcikge1xuICAgICAgICAgIHZhciBlcnJvckRhdGEgPSBlcnJvci5kYXRhO1xuICAgICAgICAgIHZhciBjdXN0b21FcnJvck1lc3NhZ2VzID0gdmFsaWRhdG9yLmVycm9yTWVzc2FnZS5jdXN0b207XG5cbiAgICAgICAgICBpZiAoY3VzdG9tRXJyb3JNZXNzYWdlcyAmJiBjdXN0b21FcnJvck1lc3NhZ2VzLmxlbmd0aCA+IDAgJiYgZXJyb3JEYXRhICYmIGVycm9yRGF0YS5jb2RlKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyTGVuZ3RoID0gY3VzdG9tRXJyb3JNZXNzYWdlcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbHRlckxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBjdXN0b21FcnJvck1lc3NhZ2VzW2ldO1xuICAgICAgICAgICAgICBpZiAoZmlsdGVyLnN0YXR1cyA9PT0gZXJyb3Iuc3RhdHVzICYmIGZpbHRlci5jb2RlID09PSBlcnJvckRhdGEuY29kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXIubWVzc2FnZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB2YWxpZGF0b3IuZXJyb3JNZXNzYWdlLmRlZmF1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSBleGNsdWRlXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzdGF0dXNDb2RlXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gdmFsaWRhdGVFeGNsdWRlKGV4Y2x1ZGUsIHN0YXR1c0NvZGUpIHtcbiAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNPYmplY3QoZXhjbHVkZSkgfHwgIWFuZ3VsYXIuaXNBcnJheShleGNsdWRlLnN0YXR1c0NvZGVzKSB8fCBleGNsdWRlLnN0YXR1c0NvZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGV4Y2x1ZGUuc3RhdHVzQ29kZXMuaW5kZXhPZihzdGF0dXNDb2RlKSA9PT0gLTE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBtYXRjaFVybCh2YWxpZGF0b3IsIGNvbmZpZykge1xuICAgICAgICAgIGlmICghdmFsaWRhdG9yIHx8ICFjb25maWcgfHwgIWNvbmZpZy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgbWF0Y2hSZXN1bHQgPSB2YWxpZGF0b3IuZXJyb3JVcmwuZXhlYyhjb25maWcudXJsLCBjb25maWcucGFyYW1zKTtcbiAgICAgICAgICBpZiAobWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgICBpZiAobWF0Y2hSZXN1bHRba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XVxuICB9O1xuXG4gIHJldHVybiBwcm92aWRlcjtcblxuICAvLy8vLy8vL1xuXG4gIC8qKlxuICAgKiBleGFtcGxlIGZvciBQQVRDSCBSZXF1ZXN0OlxuICAgKiAndXJsJywgJ1BBVENIJywgJ2Vycm9yLXRyYW5zbGF0aW9uLWtleSdcbiAgICpcbiAgICogZXhhbXBsZSBmb3IgZXhjbHVkZSBodHRwLXN0YXR1czo0MDAgd2l0aCByZXNwb25zZSBlcnJvci1jb2RlOjEwMFxuICAgKiAndXJsJywgJ1BBVENIJywge2N1c3RvbTogW3tzdGF0dXM6IDQwMCxjb2RlOiAxMDAsbWVzc2FnZTogJ215IGN1c3RvbSBlcnJvciBtZXNzYWdlJ31dLCBkZWZhdWx0OiAnZXJyb3IgZGVmYXVsdCd9XG4gICAqXG4gICAqIGV4YW1wbGUgZm9yIGV4Y2x1ZGUgc29tZSBzdGF0dXMgY29kZXNcbiAgICogJ3VybCcsICdQQVRDSCcsICdlcnJvci10cmFuc2xhdGlvbi1rZXknLCB7c3RhdHVzQ29kZXM6IFs0MDAsIDQwMSwgNDAyLCA0MDNdfVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXJyb3JVcmxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZFxuICAgKiBAcGFyYW0ge3N0cmluZ3xPYmplY3R9IGVycm9yTWVzc2FnZVxuICAgKiBAcGFyYW0ge09iamVjdD19IGV4Y2x1ZGVcbiAgICovXG4gIGZ1bmN0aW9uIGFkZEVycm9ySGFuZGxpbmcoZXJyb3JVcmwsIG1ldGhvZCwgZXJyb3JNZXNzYWdlLCBleGNsdWRlKSB7XG5cbiAgICBpZiAoJGluamVjdG9yLmhhcygnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWkuQWxlcnRTZXJ2aWNlLlJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvclByb3ZpZGVyOk5vICR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyIHdhcyBmb3VuZC4gVGhpcyBpcyBhIGRlcGVuZGVuY3kgdG8gQW5ndWxhclVJIFJvdXRlci4nKTtcbiAgICB9XG5cbiAgICBlcnJvcnMucHVzaCh7XG4gICAgICBlcnJvclVybDogJGluamVjdG9yLmdldCgnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKS5jb21waWxlKGVycm9yVXJsKSxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgZXJyb3JNZXNzYWdlOiBlcnJvck1lc3NhZ2UsXG4gICAgICBleGNsdWRlOiBleGNsdWRlXG4gICAgfSk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvclByb3ZpZGVyO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9SZXNwb25zZUVycm9ySW50ZXJjZXB0b3IuanNcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nSW5qZWN0XG4gKi9cbmZ1bmN0aW9uIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXIoJGluamVjdG9yKSB7XG5cbiAgdmFyIGVycm9yU3RhdGVzID0gW107XG5cbiAgdmFyIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXIgPSB7XG4gICAgYWRkRXJyb3JIYW5kbGluZzogYWRkRXJyb3JIYW5kbGluZyxcbiAgICAkZ2V0OiBbJyRyb290U2NvcGUnLCAnJGluamVjdG9yJywgJ0FsZXJ0U2VydmljZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkaW5qZWN0b3IsIEFsZXJ0U2VydmljZSkge1xuXG4gICAgICB2YXIgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIgPSB7XG4gICAgICAgIGluaXQ6IGluaXQsXG4gICAgICAgIGhhc1N0YXRlRXJyb3I6IGhhc1N0YXRlRXJyb3JcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcjtcblxuICAgICAgLy8vLy8vL1xuXG4gICAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBzdGF0ZUNoYW5nZUVycm9yKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaGFzU3RhdGVFcnJvcihzdGF0ZSkge1xuICAgICAgICByZXR1cm4gZXJyb3JTdGF0ZXMuc29tZShmdW5jdGlvbiAoZXJyb3JTdGF0ZSkge1xuICAgICAgICAgIHJldHVybiBlcnJvclN0YXRlLnN0YXRlID09PSBzdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHN0YXRlQ2hhbmdlRXJyb3IoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMsIGVycm9yKSB7XG4gICAgICAgIGVycm9yU3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKGVycm9yU3RhdGUpIHtcbiAgICAgICAgICBpZiAodG9TdGF0ZS5uYW1lID09PSBlcnJvclN0YXRlLnN0YXRlICYmIGVycm9yLmNvbmZpZyAmJiBlcnJvci5jb25maWcudXJsICYmXG4gICAgICAgICAgICBlcnJvclN0YXRlLmVycm9yVXJsLmV4ZWMoZXJyb3IuY29uZmlnLnVybCkgJiYgZXJyb3IuY29uZmlnLm1ldGhvZCA9PT0gZXJyb3JTdGF0ZS5tZXRob2QpIHtcbiAgICAgICAgICAgIEFsZXJ0U2VydmljZS5hZGQoJ2RhbmdlcicsIGVycm9yU3RhdGUuZXJyb3JNZXNzYWdlKTtcblxuICAgICAgICAgICAgaWYgKGVycm9yU3RhdGUuaGFuZGxlTWV0aG9kKSB7XG4gICAgICAgICAgICAgICRpbmplY3Rvci5pbnZva2UoZXJyb3JTdGF0ZS5oYW5kbGVNZXRob2QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfV1cbiAgfTtcblxuICByZXR1cm4gU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXJQcm92aWRlcjtcblxuICAvLy8vLy8vL1xuXG4gIGZ1bmN0aW9uIGFkZEVycm9ySGFuZGxpbmcoc3RhdGUsIGVycm9yVXJsLCBtZXRob2QsIGVycm9yTWVzc2FnZSwgaGFuZGxlTWV0aG9kKSB7XG5cbiAgICBpZiAoJGluamVjdG9yLmhhcygnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWkuQWxlcnRTZXJ2aWNlLlN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXI6Tm8gJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXIgd2FzIGZvdW5kLiBUaGlzIGlzIGEgZGVwZW5kZW5jeSB0byBBbmd1bGFyVUkgUm91dGVyLicpO1xuICAgIH1cblxuICAgIGVycm9yU3RhdGVzLnB1c2goe1xuICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgZXJyb3JVcmw6ICRpbmplY3Rvci5nZXQoJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJykuY29tcGlsZShlcnJvclVybCksXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIGVycm9yTWVzc2FnZTogZXJyb3JNZXNzYWdlLFxuICAgICAgaGFuZGxlTWV0aG9kOiBoYW5kbGVNZXRob2RcbiAgICB9KTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXJQcm92aWRlcjtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyLmpzXG4gKiogbW9kdWxlIGlkID0gM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==