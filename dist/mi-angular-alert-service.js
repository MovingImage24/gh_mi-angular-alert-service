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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNTU1MDg3NGFkZjRhOGEzNzA2YTgiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9BbGVydFNlcnZpY2UuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9SZXNwb25zZUVycm9ySW50ZXJjZXB0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUN0Q0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYSxjQUFjO0FBQzNCLGVBQWMsY0FBYztBQUM1QixlQUFjLGNBQWM7QUFDNUIsWUFBVztBQUNYLElBQUc7QUFDSDs7Ozs7Ozs7QUNuQkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQy9EQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBUztBQUNUO0FBQ0EsTUFBSztBQUNMOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFLO0FBQ0w7O0FBRUE7O0FBRUEsa0Q7Ozs7OztBQ3BFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7O0FBSUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFVBQVM7O0FBRVQ7QUFDQTtBQUNBLFVBQVM7O0FBRVQ7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0EsK0NBQThDLFNBQVM7QUFDdkQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNEJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBTztBQUNQOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUFnRCxrREFBa0Q7QUFDbEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQUs7QUFDTDs7QUFFQTs7QUFFQSIsImZpbGUiOiJtaS1hbmd1bGFyLWFsZXJ0LXNlcnZpY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDU1NTA4NzRhZGY0YThhMzcwNmE4XG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQWxlcnRTZXJ2aWNlID0gcmVxdWlyZSgnLi9BbGVydFNlcnZpY2UnKSxcbiAgICBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlciA9IHJlcXVpcmUoJy4vU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXInKSxcbiAgICBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3IgPSByZXF1aXJlKCcuL1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXJcbiAgLm1vZHVsZSgnbWkuQWxlcnRTZXJ2aWNlJywgW10pXG5cbiAgLnByb3ZpZGVyKCdTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcicsIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyKVxuICAucHJvdmlkZXIoJ1Jlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcicsIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcilcblxuICAuc2VydmljZSgnQWxlcnRTZXJ2aWNlJywgQWxlcnRTZXJ2aWNlKVxuICAuY29uc3RhbnQoJ0FMRVJUX0xFVkVMUycsIHtcbiAgICBkYW5nZXI6IHt0aW1lb3V0OiA1MDAwfSxcbiAgICB3YXJuaW5nOiB7dGltZW91dDogNDAwMH0sXG4gICAgc3VjY2Vzczoge3RpbWVvdXQ6IDMwMDB9LFxuICAgIGluZm86IHt0aW1lb3V0OiAyMDAwfVxuICB9KVxuO1xuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ0luamVjdFxuICovXG5mdW5jdGlvbiBBbGVydFNlcnZpY2UoJHJvb3RTY29wZSwgJHRpbWVvdXQsIEFMRVJUX0xFVkVMUywgJGluamVjdG9yKSB7XG5cbiAgLy8gY3JlYXRlIGFuIGFycmF5IG9mIGFsZXJ0cyBhdmFpbGFibGUgZ2xvYmFsbHlcbiAgJHJvb3RTY29wZS5hbGVydHMgPSBbXTtcblxuICB2YXIgYWxlcnRTZXJ2aWNlID0ge1xuICAgIGFkZDogYWRkLFxuICAgIGNsb3NlQWxlcnQ6IGNsb3NlQWxlcnQsXG4gICAgY2xvc2VBbGVydElkeDogY2xvc2VBbGVydElkeCxcbiAgICBjbGVhcjogY2xlYXJcbiAgfTtcblxuICByZXR1cm4gYWxlcnRTZXJ2aWNlO1xuXG4gIC8vLy8vLy8vLy8vL1xuXG4gIGZ1bmN0aW9uIGFkZCh0eXBlLCBtc2csIHRpbWVvdXQpIHtcblxuICAgIGlmICgkaW5qZWN0b3IuaGFzKCckdHJhbnNsYXRlJykpIHtcbiAgICAgIG1zZyA9ICRpbmplY3Rvci5nZXQoJyR0cmFuc2xhdGUnKS5pbnN0YW50KG1zZyk7XG4gICAgfVxuXG4gICAgdmFyIGFsZXJ0ID0ge1xuICAgICAgdHlwZTogdHlwZSxcbiAgICAgIG1zZzogbXNnLFxuICAgICAgY2xvc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFsZXJ0U2VydmljZS5jbG9zZUFsZXJ0KHRoaXMpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAkcm9vdFNjb3BlLmFsZXJ0cy5wdXNoKGFsZXJ0KTtcblxuICAgIGlmICh0aW1lb3V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRpbWVvdXQgPSAodHlwZSBpbiBBTEVSVF9MRVZFTFMpID8gQUxFUlRfTEVWRUxTW3R5cGVdLnRpbWVvdXQgOiAwO1xuICAgIH1cblxuICAgIC8vIGVycm9yIHdhcm5pbmdzICh0eXBlICdkYW5nZXInKSBtdXN0IG5vdCBjbG9zZSBhZnRlciB0aW1lb3V0LFxuICAgIC8vIGJ1dCBzaGFsbCBiZSBjbG9zZWQgbWFudWFsbHlcbiAgICBpZiAodGltZW91dCA+IDAgJiYgYWxlcnQudHlwZSAhPT0gJ2RhbmdlcicpIHtcbiAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYWxlcnRTZXJ2aWNlLmNsb3NlQWxlcnQoYWxlcnQpO1xuICAgICAgfSwgdGltZW91dCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VBbGVydChhbGVydCkge1xuICAgIHJldHVybiBhbGVydFNlcnZpY2UuY2xvc2VBbGVydElkeCgkcm9vdFNjb3BlLmFsZXJ0cy5pbmRleE9mKGFsZXJ0KSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZUFsZXJ0SWR4KGluZGV4KSB7XG4gICAgcmV0dXJuICRyb290U2NvcGUuYWxlcnRzLnNwbGljZShpbmRleCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICAkcm9vdFNjb3BlLmFsZXJ0cyA9IFtdO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWxlcnRTZXJ2aWNlO1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9BbGVydFNlcnZpY2UuanNcbiAqKiBtb2R1bGUgaWQgPSAxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5nSW5qZWN0XG4gKi9cbmZ1bmN0aW9uIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXIoJGluamVjdG9yKSB7XG5cbiAgdmFyIGVycm9yU3RhdGVzID0gW107XG5cbiAgdmFyIFN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXIgPSB7XG4gICAgYWRkRXJyb3JIYW5kbGluZzogYWRkRXJyb3JIYW5kbGluZyxcbiAgICAkZ2V0OiBbJyRyb290U2NvcGUnLCAnJGluamVjdG9yJywgJ0FsZXJ0U2VydmljZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkaW5qZWN0b3IsIEFsZXJ0U2VydmljZSkge1xuXG4gICAgICB2YXIgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIgPSB7XG4gICAgICAgIGluaXQ6IGluaXQsXG4gICAgICAgIGhhc1N0YXRlRXJyb3I6IGhhc1N0YXRlRXJyb3JcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcjtcblxuICAgICAgLy8vLy8vL1xuXG4gICAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlRXJyb3InLCBzdGF0ZUNoYW5nZUVycm9yKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaGFzU3RhdGVFcnJvcihzdGF0ZSkge1xuICAgICAgICByZXR1cm4gZXJyb3JTdGF0ZXMuc29tZShmdW5jdGlvbiAoZXJyb3JTdGF0ZSkge1xuICAgICAgICAgIHJldHVybiBlcnJvclN0YXRlLnN0YXRlID09PSBzdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHN0YXRlQ2hhbmdlRXJyb3IoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMsIGVycm9yKSB7XG4gICAgICAgIGVycm9yU3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKGVycm9yU3RhdGUpIHtcbiAgICAgICAgICBpZiAodG9TdGF0ZS5uYW1lID09PSBlcnJvclN0YXRlLnN0YXRlICYmIGVycm9yLmNvbmZpZyAmJiBlcnJvci5jb25maWcudXJsICYmXG4gICAgICAgICAgICBlcnJvclN0YXRlLmVycm9yVXJsLmV4ZWMoZXJyb3IuY29uZmlnLnVybCkgJiYgZXJyb3IuY29uZmlnLm1ldGhvZCA9PT0gZXJyb3JTdGF0ZS5tZXRob2QpIHtcbiAgICAgICAgICAgIEFsZXJ0U2VydmljZS5hZGQoJ2RhbmdlcicsIGVycm9yU3RhdGUuZXJyb3JNZXNzYWdlKTtcblxuICAgICAgICAgICAgaWYgKGVycm9yU3RhdGUuaGFuZGxlTWV0aG9kKSB7XG4gICAgICAgICAgICAgICRpbmplY3Rvci5pbnZva2UoZXJyb3JTdGF0ZS5oYW5kbGVNZXRob2QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfV1cbiAgfTtcblxuICByZXR1cm4gU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXJQcm92aWRlcjtcblxuICAvLy8vLy8vL1xuXG4gIGZ1bmN0aW9uIGFkZEVycm9ySGFuZGxpbmcoc3RhdGUsIGVycm9yVXJsLCBtZXRob2QsIGVycm9yTWVzc2FnZSwgaGFuZGxlTWV0aG9kKSB7XG5cbiAgICBpZiAoJGluamVjdG9yLmhhcygnJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXInKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWkuQWxlcnRTZXJ2aWNlLlN0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyUHJvdmlkZXI6Tm8gJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXIgd2FzIGZvdW5kLiBUaGlzIGlzIGEgZGVwZW5kZW5jeSB0byBBbmd1bGFyVUkgUm91dGVyLicpO1xuICAgIH1cblxuICAgIGVycm9yU3RhdGVzLnB1c2goe1xuICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgZXJyb3JVcmw6ICRpbmplY3Rvci5nZXQoJyR1cmxNYXRjaGVyRmFjdG9yeVByb3ZpZGVyJykuY29tcGlsZShlcnJvclVybCksXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIGVycm9yTWVzc2FnZTogZXJyb3JNZXNzYWdlLFxuICAgICAgaGFuZGxlTWV0aG9kOiBoYW5kbGVNZXRob2RcbiAgICB9KTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXJQcm92aWRlcjtcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL1N0YXRlQ2hhbmdlRXJyb3JIYW5kbGVyLmpzXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ0luamVjdFxuICovXG5mdW5jdGlvbiBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3JQcm92aWRlcigkaW5qZWN0b3IpIHtcblxuICB2YXIgZXJyb3JzID0gW107XG4gIHZhciBzdGF0ZU5hbWU7XG5cblxuXG4gIHZhciBwcm92aWRlciA9IHtcbiAgICBhZGRFcnJvckhhbmRsaW5nOiBhZGRFcnJvckhhbmRsaW5nLFxuICAgICRnZXQ6IFsnJHEnLCAnJHJvb3RTY29wZScsICdTdGF0ZUNoYW5nZUVycm9ySGFuZGxlcicsICdBbGVydFNlcnZpY2UnLFxuICAgICAgZnVuY3Rpb24gKCRxLCAkcm9vdFNjb3BlLCBTdGF0ZUNoYW5nZUVycm9ySGFuZGxlciwgQWxlcnRTZXJ2aWNlKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlKSB7XG4gICAgICAgICAgc3RhdGVOYW1lID0gdG9TdGF0ZS5uYW1lO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzdGF0ZU5hbWUgPSAnJztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvciA9IHtcbiAgICAgICAgICByZXNwb25zZUVycm9yOiByZXNwb25zZUVycm9yXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlRXJyb3JJbnRlcmNlcHRvcjtcblxuICAgICAgICAvLy8vLy8vXG5cbiAgICAgICAgZnVuY3Rpb24gcmVzcG9uc2VFcnJvcihlcnJvcikge1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBlcnJvcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpc0Vycm9yVmFsaWRhdG9yKGVycm9yc1tpXSwgZXJyb3IpKSB7XG4gICAgICAgICAgICAgIHZhciBlcnJNZXNzYWdlID0gZXJyb3JzW2ldLmVycm9yTWVzc2FnZTtcblxuICAgICAgICAgICAgICBpZiAoZXJyTWVzc2FnZSAhPT0gbnVsbCAmJiB0eXBlb2YgZXJyTWVzc2FnZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBlcnJNZXNzYWdlID0gZ2V0Q3VzdG9tRXJyb3JNZXNzYWdlKGVycm9yc1tpXSwgZXJyb3IpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgQWxlcnRTZXJ2aWNlLmFkZCgnZGFuZ2VyJywgZXJyTWVzc2FnZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNFcnJvclZhbGlkYXRvcihlcnJvclZhbGlkYXRvciwgZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gbWF0Y2hVcmwoZXJyb3JWYWxpZGF0b3IsIGVycm9yLmNvbmZpZykgJiZcbiAgICAgICAgICAgIGVycm9yLmNvbmZpZy5tZXRob2QgPT09IGVycm9yVmFsaWRhdG9yLm1ldGhvZCAmJlxuICAgICAgICAgICAgU3RhdGVDaGFuZ2VFcnJvckhhbmRsZXIuaGFzU3RhdGVFcnJvcihzdGF0ZU5hbWUpID09PSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldEN1c3RvbUVycm9yTWVzc2FnZSh2YWxpZGF0b3IsIGVycm9yKSB7XG4gICAgICAgICAgdmFyIGVycm9yRGF0YSA9IGVycm9yLmRhdGE7XG4gICAgICAgICAgdmFyIGN1c3RvbUVycm9yTWVzc2FnZXMgPSB2YWxpZGF0b3IuZXJyb3JNZXNzYWdlLmN1c3RvbTtcblxuICAgICAgICAgIGlmIChjdXN0b21FcnJvck1lc3NhZ2VzICYmIGN1c3RvbUVycm9yTWVzc2FnZXMubGVuZ3RoID4gMCAmJiBlcnJvckRhdGEgJiYgZXJyb3JEYXRhLmNvZGUpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXJMZW5ndGggPSBjdXN0b21FcnJvck1lc3NhZ2VzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsdGVyTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgdmFyIGZpbHRlciA9IGN1c3RvbUVycm9yTWVzc2FnZXNbaV07XG4gICAgICAgICAgICAgIGlmIChmaWx0ZXIuc3RhdHVzID09PSBlcnJvci5zdGF0dXMgJiYgZmlsdGVyLmNvZGUgPT09IGVycm9yRGF0YS5jb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlci5tZXNzYWdlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHZhbGlkYXRvci5lcnJvck1lc3NhZ2UuZGVmYXVsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG1hdGNoVXJsKHZhbGlkYXRvciwgY29uZmlnKSB7XG4gICAgICAgICAgaWYgKCF2YWxpZGF0b3IgfHwgIWNvbmZpZyB8fCAhY29uZmlnLnVybCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBtYXRjaFJlc3VsdCA9IHZhbGlkYXRvci5lcnJvclVybC5leGVjKGNvbmZpZy51cmwsIGNvbmZpZy5wYXJhbXMpO1xuICAgICAgICAgIGlmIChtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIG1hdGNoUmVzdWx0KSB7XG4gICAgICAgICAgICAgIGlmIChtYXRjaFJlc3VsdFtrZXldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1dXG4gIH07XG5cbiAgcmV0dXJuIHByb3ZpZGVyO1xuXG4gIC8vLy8vLy8vXG5cbiAgLyoqXG4gICAqXG4gICAqIGV4YW1wbGUgZm9yIFBBVENIIFJlcXVlc3Q6XG4gICAqICd1cmwnLCAnUEFUQ0gnLCAnZXJyb3ItdHJhbnNsYXRpb24ta2V5J1xuICAgKlxuICAgKiBleGFtcGxlIGZvciBleGNsdWRlIGh0dHAtc3RhdHVzOjQwMCB3aXRoIHJlc3BvbnNlIGVycm9yLWNvZGU6MTAwXG4gICAqICd1cmwnLCAnUEFUQ0gnLCAnZXJyb3ItdHJhbnNsYXRpb24ta2V5JywgW3tzdGF0dXM6IDQwMCwgY29kZTogMTAwLCBtZXNzYWdlOiAndHJhbnNsYXRpb24ua2V5fV1cbiAgICpcbiAgICogQHBhcmFtIGVycm9yVXJsXG4gICAqIEBwYXJhbSBtZXRob2RcbiAgICogQHBhcmFtIGVycm9yTWVzc2FnZVxuICAgKi9cbiAgZnVuY3Rpb24gYWRkRXJyb3JIYW5kbGluZyhlcnJvclVybCwgbWV0aG9kLCBlcnJvck1lc3NhZ2UpIHtcblxuICAgIGlmICgkaW5qZWN0b3IuaGFzKCckdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlcicpID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtaS5BbGVydFNlcnZpY2UuUmVzcG9uc2VFcnJvckludGVyY2VwdG9yUHJvdmlkZXI6Tm8gJHVybE1hdGNoZXJGYWN0b3J5UHJvdmlkZXIgd2FzIGZvdW5kLiBUaGlzIGlzIGEgZGVwZW5kZW5jeSB0byBBbmd1bGFyVUkgUm91dGVyLicpO1xuICAgIH1cblxuICAgIGVycm9ycy5wdXNoKHtcbiAgICAgIGVycm9yVXJsOiAkaW5qZWN0b3IuZ2V0KCckdXJsTWF0Y2hlckZhY3RvcnlQcm92aWRlcicpLmNvbXBpbGUoZXJyb3JVcmwpLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICBlcnJvck1lc3NhZ2U6IGVycm9yTWVzc2FnZVxuICAgIH0pO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXNwb25zZUVycm9ySW50ZXJjZXB0b3JQcm92aWRlcjtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvUmVzcG9uc2VFcnJvckludGVyY2VwdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==