'use strict';

describe('Service :  ResponseErrorInterceptor', function () {
  var $rootScope, $q, interceptor, StateChangeErrorHandler, AlertService, youtubeUpdateItemMessages;

  beforeEach(function () {
    angular.mock.module('mi.AlertService');
    angular.mock.module(function ($provide) {
      AlertService = jasmine.createSpyObj('AlertService', ['add']);
      StateChangeErrorHandler = jasmine.createSpyObj('StateChangeErrorHandler', ['hasStateError']);

      $provide.service('AlertService', function () {
        return AlertService;
      });
      $provide.factory('StateChangeErrorHandler', function () {
        return StateChangeErrorHandler;
      });
    });
  });

  describe('tests without angular-ui-router', function () {
    var provider;
    beforeEach(function () {
      angular.mock.module(function (ResponseErrorInterceptorProvider) {
        provider = ResponseErrorInterceptorProvider;
      });
    });

    it('should', angular.mock.inject(function () {
      expect(function () {
        provider.addErrorHandling('dummyUri', 'GET', 'error')
      }).toThrowError('mi.AlertService.ResponseErrorInterceptorProvider:No $urlMatcherFactoryProvider was found. This is a dependency to AngularUI Router.')
    }));
  });

  describe('tests with angular-ui-router', function () {
    var provider;
    beforeEach(function () {
      angular.mock.module('ui.router.util');

      angular.mock.module(function (ResponseErrorInterceptorProvider) {
        provider=ResponseErrorInterceptorProvider
        youtubeUpdateItemMessages = {
          custom: [{
            status: 400,
            code: 100,
            message: 'my custom error message'
          }],
          default: 'error default'
        };

        provider.addErrorHandling('dummyUri', 'GET', 'error');
        provider.addErrorHandling('dummyUriInclude', 'GET', 'error', null, {statusCodes: [403]});
        provider.addErrorHandling('dummyFilterUri', 'GET', youtubeUpdateItemMessages);
        provider.addErrorHandling('http://dummy.de/list/{vid}', 'GET', 'error getting item');
        provider.addErrorHandling('http://dummy.de/list?search_term', 'GET', 'error search-param');
        provider.addErrorHandling('http://dummy.de/list?limit&offset', 'GET', 'error paging-param');
        provider.addErrorHandling('http://dummy.de/list', 'DELETE', 'error delete', {statusCodes: [403]});
        provider.addErrorHandling('dummyUriExcludeIncludeNull', 'GET', 'error', {statusCodes: [400]}, null)
        provider.addErrorHandling('dummyUriExcludeNullIncludeNull', 'GET', 'error', null, null)
      });

      angular.mock.inject(function ($injector) {
        $q = $injector.get('$q');
        $rootScope = $injector.get('$rootScope');
        interceptor = $injector.get('ResponseErrorInterceptor');
      });
    });

    it('should do nothing if error has no config', function () {
      interceptor.responseError({});
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should do nothing if error url does not match', function () {
      interceptor.responseError({config: {url: 'wrong'}});
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should do nothing if error method does not match', function () {
      interceptor.responseError({config: {url: 'dummyUri', method: 'POST'}});
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should do nothing if it exist a error handling for this state', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(true);

      interceptor.responseError({config: {url: 'dummyUri', method: 'GET'}});
      expect(AlertService.add).not.toHaveBeenCalled();
      expect(StateChangeErrorHandler.hasStateError).toHaveBeenCalledWith('stateName');
    });

    it('should do nothing if it exist a error handling for this state and reset stateName if stateChange was successful', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(true);

      interceptor.responseError({config: {url: 'dummyUri', method: 'GET'}});
      expect(AlertService.add).not.toHaveBeenCalled();
      expect(StateChangeErrorHandler.hasStateError).toHaveBeenCalledWith('stateName');
      $rootScope.$broadcast('$stateChangeSuccess');
      $rootScope.$apply();
      interceptor.responseError({config: {url: 'dummyUri', method: 'GET'}});
      expect(AlertService.add).not.toHaveBeenCalled();
      expect(StateChangeErrorHandler.hasStateError).toHaveBeenCalledWith('');
    });

    it('should emit an error', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({config: {url: 'dummyUri', method: 'GET'}});
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error');
      expect(StateChangeErrorHandler.hasStateError).toHaveBeenCalledWith('stateName');
    });


    it('should throw error paging', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {
          url: 'http://dummy.de/list',
          method: 'GET',
          params: {
            offset: '3',
            limit: '4',
            search_term: undefined
          }
        }
      });

      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error paging-param');
      expect(AlertService.add.calls.count()).toEqual(1);
      expect(StateChangeErrorHandler.hasStateError).toHaveBeenCalledWith('stateName');
    });


    it('should throw error search failed', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {
          url: 'http://dummy.de/list',
          method: 'GET',
          params: {
            offset: '5',
            limit: '6',
            search_term: 'blaa'
          }
        }
      });

      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error search-param');
      expect(AlertService.add.calls.count()).toEqual(1);
      expect(StateChangeErrorHandler.hasStateError).toHaveBeenCalledWith('stateName');
    });

    it('should display custom error message', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {url: 'dummyFilterUri', method: 'GET'},
        data: {code: 100, message: 'some error'},
        status: 400
      });
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'my custom error message');
      expect(AlertService.add.calls.count()).toEqual(1);
    });

    it('should display default error message if no custom errors are set', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      delete youtubeUpdateItemMessages.custom;

      interceptor.responseError({
        config: {url: 'dummyFilterUri', method: 'GET'},
        data: {code: 100, message: 'some error'},
        status: 400
      });

      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error default');
      expect(AlertService.add.calls.count()).toEqual(1);
    });

    it('should display error message and not custom error message', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {url: 'dummyFilterUri', method: 'GET'},
        data: {code: 99, message: 'some error'},
        status: 400
      });
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error default');
    });

    it('should show no error message because the error code is ', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {url: 'http://dummy.de/list', method: 'DELETE'},
        status: 403
      });
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should display error message if the status code is included', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {url: 'dummyUriInclude', method: 'GET'},
        data: {code: 100, message: 'some error'},
        status: 403
      });
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error');
      expect(AlertService.add.calls.count()).toEqual(1);
    });

    it('should not display error message if the status code is not included', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {url: 'dummyUriInclude', method: 'GET'},
        data: {code: 100, message: 'some error'},
        status: 400
      });
      expect(AlertService.add).not.toHaveBeenCalled();
    });

    it('should not throw an error if exclude and include are set but include is null', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {url: 'dummyUriExcludeIncludeNull', method: 'GET'},
        data: {code: 100, message: 'some error'},
        status: 403
      });
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error');
      expect(AlertService.add.calls.count()).toEqual(1);
    });

    it('should not throw an error if exclude and include are set but both are null', function () {
      $rootScope.$broadcast('$stateChangeStart', {name: 'stateName'});
      $rootScope.$apply();
      StateChangeErrorHandler.hasStateError.and.returnValue(false);

      interceptor.responseError({
        config: {url: 'dummyUriExcludeNullIncludeNull', method: 'GET'},
        data: {code: 100, message: 'some error'},
        status: 403
      });
      expect(AlertService.add).toHaveBeenCalledWith('danger', 'error');
      expect(AlertService.add.calls.count()).toEqual(1);
    });

    it('should throw an error if exclude and include are set', angular.mock.inject(function () {
      expect(function () {
        provider.addErrorHandling('dummyUriIncludeExcludeSet', 'GET', 'error', {statusCodes: [400]}, {statusCodes: [403]})
      }).toThrowError('mi.AlertService.ResponseErrorInterceptorProvider:Include and exclude parameter must not be set at the same time.')
    }));

  });

});


