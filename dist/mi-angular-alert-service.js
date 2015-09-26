/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var AlertService = __webpack_require__(1),
	    StateChangeErrorHandler = __webpack_require__(2),
	    ResponseErrorInterceptor = __webpack_require__(3);
	
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
	
	module.exports = AlertService;


/***/ },
/* 2 */
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
	
	module.exports = StateChangeErrorHandlerProvider;

/***/ },
/* 3 */
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


/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZGFmODEzZjE0MWNlN2JiYjU1YWQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9BbGVydFNlcnZpY2UuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9SZXNwb25zZUVycm9ySW50ZXJjZXB0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUN0Q0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYSxjQUFjO0FBQzNCLGVBQWMsY0FBYztBQUM1QixlQUFjLGNBQWM7QUFDNUIsWUFBVztBQUNYLElBQUc7QUFDSDs7Ozs7Ozs7QUNuQkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7O0FDN0RBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFTO0FBQ1Q7QUFDQSxNQUFLO0FBQ0w7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDs7QUFFQTs7QUFFQSxrRDs7Ozs7O0FDcEVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsVUFBUzs7QUFFVDtBQUNBO0FBQ0EsVUFBUzs7QUFFVDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQSwrQ0FBOEMsU0FBUztBQUN2RDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSw0QkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFPO0FBQ1A7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaURBQWdELGtEQUFrRDtBQUNsRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBSztBQUNMOztBQUVBOztBQUVBIiwiZmlsZSI6Im1pLWFuZ3VsYXItYWxlcnQtc2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgZGFmODEzZjE0MWNlN2JiYjU1YWRcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbnZhciBBbGVydFNlcnZpY2UgPSByZXF1aXJlKCcuL0FsZXJ0U2VydmljZScpLFxuICAgIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyID0gcmVxdWlyZSgnLi9TdGF0ZUNoYW5nZUVycm9ySGFuZGxlcicpLFxuICAgIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvciA9IHJlcXVpcmUoJy4vUmVzcG9uc2VFcnJvckludGVyY2VwdG9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhclxuICAubW9kdWxlKCdtaS5BbGVydFNlcnZpY2UnLCBbXSlcblxuICAucHJvdmlkZXIoJ1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyJywgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIpXG4gIC5wcm92aWRlcignUmVzcG9uc2VFcnJvckludGVyY2VwdG9yJywgUmVzcG9uc2VFcnJvckludGVyY2VwdG9yKVxuXG4gIC5zZXJ2aWNlKCdBbGVydFNlcnZpY2UnLCBBbGVydFNlcnZpY2UpXG4gIC5jb25zdGFudCgnQUxFUlRfTEVWRUxTJywge1xuICAgIGRhbmdlcjoge3RpbWVvdXQ6IDUwMDB9LFxuICAgIHdhcm5pbmc6IHt0aW1lb3V0OiA0MDAwfSxcbiAgICBzdWNjZXNzOiB7dGltZW91dDogMzAwMH0sXG4gICAgaW5mbzoge3RpbWVvdXQ6IDIwMDB9XG4gIH0pXG47XG5cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAwXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nSW5qZWN0XG4gKi9cbmZ1bmN0aW9uIEFsZXJ0U2VydmljZSgkcm9vdFNjb3BlLCAkdGltZW91dCwgQUxFUlRfTEVWRUxTLCAkaW5qZWN0b3IpIHtcblxuICAvLyBjcmVhdGUgYW4gYXJyYXkgb2YgYWxlcnRzIGF2YWlsYWJsZSBnbG9iYWxseVxuICAkcm9vdFNjb3BlLmFsZXJ0cyA9IFtdO1xuXG4gIHZhciBhbGVydFNlcnZpY2UgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgY2xvc2VBbGVydDogY2xvc2VBbGVydCxcbiAgICBjbG9zZUFsZXJ0SWR4OiBjbG9zZUFsZXJ0SWR4LFxuICAgIGNsZWFyOiBjbGVhclxuICB9O1xuXG4gIHJldHVybiBhbGVydFNlcnZpY2U7XG5cbiAgLy8vLy8vLy8vLy8vXG5cbiAgZnVuY3Rpb24gYWRkKHR5cGUsIG1zZywgdGltZW91dCkge1xuXG4gICAgaWYgKCRpbmplY3Rvci5oYXMoJyR0cmFuc2xhdGUnKSkge1xuICAgICAgbXNnID0gJGluamVjdG9yLmdldCgnJHRyYW5zbGF0ZScpLmluc3RhbnQobXNnKTtcbiAgICB9XG5cbiAgICB2YXIgYWxlcnQgPSB7XG4gICAgICB0eXBlOiB0eXBlLFxuICAgICAgbXNnOiBtc2csXG4gICAgICBjbG9zZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYWxlcnRTZXJ2aWNlLmNsb3NlQWxlcnQodGhpcyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRyb290U2NvcGUuYWxlcnRzLnB1c2goYWxlcnQpO1xuXG4gICAgaWYgKHRpbWVvdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGltZW91dCA9ICh0eXBlIGluIEFMRVJUX0xFVkVMUykgPyBBTEVSVF9MRVZFTFNbdHlwZV0udGltZW91dCA6IDA7XG4gICAgfVxuXG4gICAgaWYgKHRpbWVvdXQgPiAwKSB7XG4gICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGFsZXJ0U2VydmljZS5jbG9zZUFsZXJ0KGFsZXJ0KTtcbiAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlQWxlcnQoYWxlcnQpIHtcbiAgICByZXR1cm4gYWxlcnRTZXJ2aWNlLmNsb3NlQWxlcnRJZHgoJHJvb3RTY29wZS5hbGVydHMuaW5kZXhPZihhbGVydCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VBbGVydElkeChpbmRleCkge1xuICAgIHJldHVybiAkcm9vdFNjb3BlLmFsZXJ0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgJHJvb3RTY29wZS5hbGVydHMgPSBbXTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFsZXJ0U2VydmljZTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvQWxlcnRTZXJ2aWNlLmpzXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ0luamVjdFxuICovXG5mdW5jdGlvbiBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyKCRpbmplY3Rvcikge1xuXG4gIHZhciBlcnJvclN0YXRlcyA9IFtdO1xuXG4gIHZhciBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyID0ge1xuICAgIGFkZEVycm9ySGFuZGxpbmc6IGFkZEVycm9ySGFuZGxpbmcsXG4gICAgJGdldDogWyckcm9vdFNjb3BlJywgJyRpbmplY3RvcicsICdBbGVydFNlcnZpY2UnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJGluamVjdG9yLCBBbGVydFNlcnZpY2UpIHtcblxuICAgICAgdmFyIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyID0ge1xuICAgICAgICBpbml0OiBpbml0LFxuICAgICAgICBoYXNTdGF0ZUVycm9yOiBoYXNTdGF0ZUVycm9yXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXI7XG5cbiAgICAgIC8vLy8vLy9cblxuICAgICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZUVycm9yJywgc3RhdGVDaGFuZ2VFcnJvcik7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGhhc1N0YXRlRXJyb3Ioc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIGVycm9yU3RhdGVzLnNvbWUoZnVuY3Rpb24gKGVycm9yU3RhdGUpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3JTdGF0ZS5zdGF0ZSA9PT0gc3RhdGU7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBzdGF0ZUNoYW5nZUVycm9yKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zLCBlcnJvcikge1xuICAgICAgICBlcnJvclN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChlcnJvclN0YXRlKSB7XG4gICAgICAgICAgaWYgKHRvU3RhdGUubmFtZSA9PT0gZXJyb3JTdGF0ZS5zdGF0ZSAmJiBlcnJvci5jb25maWcgJiYgZXJyb3IuY29uZmlnLnVybCAmJlxuICAgICAgICAgICAgZXJyb3JTdGF0ZS5lcnJvclVybC5leGVjKGVycm9yLmNvbmZpZy51cmwpICYmIGVycm9yLmNvbmZpZy5tZXRob2QgPT09IGVycm9yU3RhdGUubWV0aG9kKSB7XG4gICAgICAgICAgICBBbGVydFNlcnZpY2UuYWRkKCdkYW5nZXInLCBlcnJvclN0YXRlLmVycm9yTWVzc2FnZSk7XG5cbiAgICAgICAgICAgIGlmIChlcnJvclN0YXRlLmhhbmRsZU1ldGhvZCkge1xuICAgICAgICAgICAgICAkaW5qZWN0b3IuaW52b2tlKGVycm9yU3RhdGUuaGFuZGxlTWV0aG9kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1dXG4gIH07XG5cbiAgcmV0dXJuIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXI7XG5cbiAgLy8vLy8vLy9cblxuICBmdW5jdGlvbiBhZGRFcnJvckhhbmRsaW5nKHN0YXRlLCBlcnJvclVybCwgbWV0aG9kLCBlcnJvck1lc3NhZ2UsIGhhbmRsZU1ldGhvZCkge1xuXG4gICAgaWYgKCRpbmplY3Rvci5oYXMoJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJykgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21pLkFsZXJ0U2VydmljZS5TdGF0ZUNoYW5nZUVycm9ySGFuZGxlclByb3ZpZGVyOk5vICR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyIHdhcyBmb3VuZC4gVGhpcyBpcyBhIGRlcGVuZGVuY3kgdG8gQW5ndWxhclVJIFJvdXRlci4nKTtcbiAgICB9XG5cbiAgICBlcnJvclN0YXRlcy5wdXNoKHtcbiAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgIGVycm9yVXJsOiAkaW5qZWN0b3IuZ2V0KCckdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlcicpLmNvbXBpbGUoZXJyb3JVcmwpLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICBlcnJvck1lc3NhZ2U6IGVycm9yTWVzc2FnZSxcbiAgICAgIGhhbmRsZU1ldGhvZDogaGFuZGxlTWV0aG9kXG4gICAgfSk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXI7XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9TdGF0ZUNoYW5nZUVycm9ySGFuZGxlci5qc1xuICoqIG1vZHVsZSBpZCA9IDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmdJbmplY3RcbiAqL1xuZnVuY3Rpb24gUmVzcG9uc2VFcnJvckludGVyY2VwdG9yUHJvdmlkZXIoJGluamVjdG9yKSB7XG5cbiAgdmFyIGVycm9ycyA9IFtdO1xuICB2YXIgc3RhdGVOYW1lO1xuXG5cblxuICB2YXIgcHJvdmlkZXIgPSB7XG4gICAgYWRkRXJyb3JIYW5kbGluZzogYWRkRXJyb3JIYW5kbGluZyxcbiAgICAkZ2V0OiBbJyRxJywgJyRyb290U2NvcGUnLCAnU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXInLCAnQWxlcnRTZXJ2aWNlJyxcbiAgICAgIGZ1bmN0aW9uICgkcSwgJHJvb3RTY29wZSwgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIsIEFsZXJ0U2VydmljZSkge1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSkge1xuICAgICAgICAgIHN0YXRlTmFtZSA9IHRvU3RhdGUubmFtZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc3RhdGVOYW1lID0gJyc7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3IgPSB7XG4gICAgICAgICAgcmVzcG9uc2VFcnJvcjogcmVzcG9uc2VFcnJvclxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3I7XG5cbiAgICAgICAgLy8vLy8vL1xuXG4gICAgICAgIGZ1bmN0aW9uIHJlc3BvbnNlRXJyb3IoZXJyb3IpIHtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gZXJyb3JzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaXNFcnJvclZhbGlkYXRvcihlcnJvcnNbaV0sIGVycm9yKSkge1xuICAgICAgICAgICAgICB2YXIgZXJyTWVzc2FnZSA9IGVycm9yc1tpXS5lcnJvck1lc3NhZ2U7XG5cbiAgICAgICAgICAgICAgaWYgKGVyck1lc3NhZ2UgIT09IG51bGwgJiYgdHlwZW9mIGVyck1lc3NhZ2UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgZXJyTWVzc2FnZSA9IGdldEN1c3RvbUVycm9yTWVzc2FnZShlcnJvcnNbaV0sIGVycm9yKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIEFsZXJ0U2VydmljZS5hZGQoJ2RhbmdlcicsIGVyck1lc3NhZ2UpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzRXJyb3JWYWxpZGF0b3IoZXJyb3JWYWxpZGF0b3IsIGVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIG1hdGNoVXJsKGVycm9yVmFsaWRhdG9yLCBlcnJvci5jb25maWcpICYmXG4gICAgICAgICAgICBlcnJvci5jb25maWcubWV0aG9kID09PSBlcnJvclZhbGlkYXRvci5tZXRob2QgJiZcbiAgICAgICAgICAgIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyLmhhc1N0YXRlRXJyb3Ioc3RhdGVOYW1lKSA9PT0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRDdXN0b21FcnJvck1lc3NhZ2UodmFsaWRhdG9yLCBlcnJvcikge1xuICAgICAgICAgIHZhciBlcnJvckRhdGEgPSBlcnJvci5kYXRhO1xuICAgICAgICAgIHZhciBjdXN0b21FcnJvck1lc3NhZ2VzID0gdmFsaWRhdG9yLmVycm9yTWVzc2FnZS5jdXN0b207XG5cbiAgICAgICAgICBpZiAoY3VzdG9tRXJyb3JNZXNzYWdlcyAmJiBjdXN0b21FcnJvck1lc3NhZ2VzLmxlbmd0aCA+IDAgJiYgZXJyb3JEYXRhICYmIGVycm9yRGF0YS5jb2RlKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyTGVuZ3RoID0gY3VzdG9tRXJyb3JNZXNzYWdlcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbHRlckxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBjdXN0b21FcnJvck1lc3NhZ2VzW2ldO1xuICAgICAgICAgICAgICBpZiAoZmlsdGVyLnN0YXR1cyA9PT0gZXJyb3Iuc3RhdHVzICYmIGZpbHRlci5jb2RlID09PSBlcnJvckRhdGEuY29kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXIubWVzc2FnZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB2YWxpZGF0b3IuZXJyb3JNZXNzYWdlLmRlZmF1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBtYXRjaFVybCh2YWxpZGF0b3IsIGNvbmZpZykge1xuICAgICAgICAgIGlmICghdmFsaWRhdG9yIHx8ICFjb25maWcgfHwgIWNvbmZpZy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgbWF0Y2hSZXN1bHQgPSB2YWxpZGF0b3IuZXJyb3JVcmwuZXhlYyhjb25maWcudXJsLCBjb25maWcucGFyYW1zKTtcbiAgICAgICAgICBpZiAobWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgICBpZiAobWF0Y2hSZXN1bHRba2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XVxuICB9O1xuXG4gIHJldHVybiBwcm92aWRlcjtcblxuICAvLy8vLy8vL1xuXG4gIC8qKlxuICAgKlxuICAgKiBleGFtcGxlIGZvciBQQVRDSCBSZXF1ZXN0OlxuICAgKiAndXJsJywgJ1BBVENIJywgJ2Vycm9yLXRyYW5zbGF0aW9uLWtleSdcbiAgICpcbiAgICogZXhhbXBsZSBmb3IgZXhjbHVkZSBodHRwLXN0YXR1czo0MDAgd2l0aCByZXNwb25zZSBlcnJvci1jb2RlOjEwMFxuICAgKiAndXJsJywgJ1BBVENIJywgJ2Vycm9yLXRyYW5zbGF0aW9uLWtleScsIFt7c3RhdHVzOiA0MDAsIGNvZGU6IDEwMCwgbWVzc2FnZTogJ3RyYW5zbGF0aW9uLmtleX1dXG4gICAqXG4gICAqIEBwYXJhbSBlcnJvclVybFxuICAgKiBAcGFyYW0gbWV0aG9kXG4gICAqIEBwYXJhbSBlcnJvck1lc3NhZ2VcbiAgICovXG4gIGZ1bmN0aW9uIGFkZEVycm9ySGFuZGxpbmcoZXJyb3JVcmwsIG1ldGhvZCwgZXJyb3JNZXNzYWdlKSB7XG5cbiAgICBpZiAoJGluamVjdG9yLmhhcygnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWkuQWxlcnRTZXJ2aWNlLlJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvclByb3ZpZGVyOk5vICR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyIHdhcyBmb3VuZC4gVGhpcyBpcyBhIGRlcGVuZGVuY3kgdG8gQW5ndWxhclVJIFJvdXRlci4nKTtcbiAgICB9XG5cbiAgICBlcnJvcnMucHVzaCh7XG4gICAgICBlcnJvclVybDogJGluamVjdG9yLmdldCgnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKS5jb21waWxlKGVycm9yVXJsKSxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgZXJyb3JNZXNzYWdlOiBlcnJvck1lc3NhZ2VcbiAgICB9KTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVzcG9uc2VFcnJvckludGVyY2VwdG9yUHJvdmlkZXI7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvci5qc1xuICoqIG1vZHVsZSBpZCA9IDNcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=