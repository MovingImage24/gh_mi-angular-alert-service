'use strict';

describe('Service:AlertService', function () {

  beforeEach(function () {
    angular.mock.module('mi.AlertService');
  });

  describe('tests with $translate', function() {
    var $translate = jasmine.createSpyObj('$translate', ['instant']);
    beforeEach(function () {
      angular.mock.module(function ($provide) {
        $provide.factory('$translate', function(){ return $translate;});
      });
    });

    it('should add an alert and trigger close', angular.mock.inject(function (AlertService, $rootScope) {
      // prepare
      expect($rootScope.alerts.length).toBe(0);

      $translate.instant.and.returnValue('translated-msg');

      // trigger and compare
      AlertService.add('danger', 'msg');
      expect($rootScope.alerts.length).toBe(1);
      expect($rootScope.alerts[0].type).toBe('danger');
      expect($rootScope.alerts[0].msg).toBe('translated-msg');
      $rootScope.alerts[0].close();
      expect($rootScope.alerts.length).toBe(0);
    }));


    it('should add an alert with timer', angular.mock.inject(function (AlertService, $rootScope, $timeout) {
      // prepare
      expect($rootScope.alerts.length).toBe(0);
      $translate.instant.and.returnValue('translated-msg');

      // trigger and compare
      AlertService.add('other', 'msg', 1000);
      expect($rootScope.alerts.length).toBe(1);
      expect($rootScope.alerts[0].type).toBe('other');
      expect($rootScope.alerts[0].msg).toBe('translated-msg');
      $timeout.flush();
      expect($rootScope.alerts.length).toBe(0);
    }));

  });

  describe('tests without $translate', function() {
    it('should close an alert by id', angular.mock.inject(function (AlertService, $rootScope) {
      // prepare
      expect($rootScope.alerts.length).toBe(0);

      // trigger and compare
      AlertService.add('other', 'msg', 1000);
      expect($rootScope.alerts.length).toBe(1);
      expect($rootScope.alerts[0].type).toBe('other');
      expect($rootScope.alerts[0].msg).toBe('msg');


      AlertService.closeAlert('other');
      expect($rootScope.alerts.length).toBe(0);
    }));

    it('should close an alert by index', angular.mock.inject(function (AlertService, $rootScope) {
      // prepare
      expect($rootScope.alerts.length).toBe(0);
      AlertService.add('danger', 'msg');    // index 0
      AlertService.add('warning', 'msg');   // index 1
      AlertService.add('info', 'msg');      // index 2
      AlertService.add('success', 'msg');   // index 3
      AlertService.add('', 'msg');          // index 4 -> for testing unknown alerts
      expect($rootScope.alerts.length).toBe(5);
      expect($rootScope.alerts[1].type).toBe('warning');

      // trigger and compare
      var alertIndex = 1;
      AlertService.closeAlertIdx(alertIndex);
      expect($rootScope.alerts.length).toBe(4);
      expect($rootScope.alerts[1].type).toBe('info');
    }));

    it('should clear all alerts', angular.mock.inject(function (AlertService, $rootScope) {
      // prepare
      expect($rootScope.alerts.length).toBe(0);
      AlertService.add('danger', 'msg');
      AlertService.add('warning', 'msg');
      AlertService.add('info', 'msg');
      expect($rootScope.alerts.length).toBe(3);

      // trigger and compare
      AlertService.clear();
      expect($rootScope.alerts.length).toBe(0);
    }));

  });
});
