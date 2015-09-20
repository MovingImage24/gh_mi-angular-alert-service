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
