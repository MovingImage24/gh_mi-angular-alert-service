'use strict';

describe('Service :  StateChangeErrorHandler', function () {
  var $rootScope, $q, $state, errorHandler, AlertService;

  beforeEach(function () {
    AlertService = jasmine.createSpyObj('AlertService', ['add']);

    angular.mock.module('mi.AlertService');
    angular.mock.module(function ($provide) {
      $provide.service('AlertService', function () {
        return AlertService;
      });
      $state = jasmine.createSpyObj('$state', ['go']);
      $provide.factory('$state', function () {
        return $state;
      });
    });
  });

  describe('tests without angular-ui-router', function () {
    var provider;
    beforeEach(function () {
      angular.mock.module(function (StateChangeErrorHandlerProvider) {
        provider = StateChangeErrorHandlerProvider;
      });
    });

    it('should', angular.mock.inject(function () {
      expect(function () {
        provider.addErrorHandling('dummyUri', 'GET', 'error')
      }).toThrowError('mi.AlertService.StateChangeErrorHandlerProvider:No $urlMatcherFactoryProvider was found. This is a dependency to AngularUI Router.')
    }));
  });

  describe('tests with angular-ui-router', function () {

    beforeEach(function () {
      angular.mock.module('ui.router.util');

      angular.mock.module(function (StateChangeErrorHandlerProvider) {
        function handle($state) {
          $state.go('^');
        }

        StateChangeErrorHandlerProvider.addErrorHandling('dummy', 'dummyUri', 'GET', 'error');
        StateChangeErrorHandlerProvider.addErrorHandling('other', 'otherUri', 'GET', 'error_other', handle);
      });

      angular.mock.inject(function ($injector) {
        $q = $injector.get('$q');
        $rootScope = $injector.get('$rootScope');
        spyOn($rootScope, '$emit');
        errorHandler = $injector.get('StateChangeErrorHandler');
        errorHandler.init();
      });
    });

    it('should do nothing if state is not found', function () {
      $rootScope.$broadcast('$stateChangeError', {name: 'wrong'});
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should do nothing if state is found and error is not valid', function () {
      $rootScope.$broadcast('$stateChangeError', {name: 'dummy'}, {}, {}, {}, {});
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should do nothing if state is found and error url does not math', function () {
      $rootScope.$broadcast('$stateChangeError', {name: 'dummy'}, {}, {}, {}, {config: {url: 'other'}});
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should do nothing if state is found and error method does not math', function () {
      $rootScope.$broadcast('$stateChangeError', {name: 'dummy'}, {}, {}, {}, {
        config: {
          url: 'dummyUri',
          method: 'POST'
        }
      });
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should emit error', function () {
      $rootScope.$broadcast('$stateChangeError', {name: 'dummy'}, {}, {}, {}, {
        config: {
          url: 'dummyUri',
          method: 'GET'
        }
      });
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error');
    });

    it('should emit error and call handleMethod', function () {
      $rootScope.$broadcast('$stateChangeError', {name: 'other'}, {}, {}, {}, {
        config: {
          url: 'otherUri',
          method: 'GET'
        }
      });
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error_other');
      expect($state.go).toHaveBeenCalledWith('^');
    });

    it('should return boolean if error handler handles state error', function () {
      expect(errorHandler.hasStateError('dummy')).toBeTruthy();
      expect(errorHandler.hasStateError('wrong')).toBeFalsy();
    });
  });
});