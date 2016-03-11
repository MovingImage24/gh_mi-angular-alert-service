# Angular Alert Service

[![GitHub version](https://badge.fury.io/gh/movingimage24%2Fmi-angular-alert-service.svg)](http://badge.fury.io/gh/movingimage24%2Fmi-angular-alert-service)
[![npm version](https://img.shields.io/npm/v/mi-angular-alert-service.svg)](https://www.npmjs.com/package/mi-angular-alert-service)
[![npm downloads](https://img.shields.io/npm/dm/mi-angular-alert-service.svg)](https://www.npmjs.com/package/mi-angular-alert-service)
[![Build Status](https://img.shields.io/travis/MovingImage24/mi-angular-alert-service.svg)](https://travis-ci.org/MovingImage24/mi-angular-alert-service)
[![Coverage Status](https://coveralls.io/repos/MovingImage24/mi-angular-alert-service/badge.svg?branch=master&service=github)](https://coveralls.io/github/MovingImage24/mi-angular-alert-service?branch=master)
[![dependency Status](https://david-dm.org/MovingImage24/mi-angular-alert-service/status.svg)](https://david-dm.org/MovingImage24/mi-angular-alert-service#info=dependencies)
[![devDependency Status](https://david-dm.org/MovingImage24/mi-angular-alert-service/dev-status.svg)](https://david-dm.org/MovingImage24/mi-angular-alert-service#info=devDependencies)
[![License](https://img.shields.io/github/license/MovingImage24/mi-angular-alert-service.svg)](https://github.com/MovingImage24/mi-angular-alert-service/blob/master/LICENSE)

> Alert Service for AngularJS.

A customizable alert service for AngularJS apps. 


## Installation

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i mi-angular-alert-service --save
```


## Usage

**Attention**, the integration of bootstrap is required for the example ...


```sh
# app.js
require('angular-bootstrap');
require('mi-angular-alert-service');
var requires = [
  'ui.bootstrap',
  'mi.AlertService'
];
angular.module('sample-app', requires)
  // defaults for alert service
  .constant('ALERT_LEVELS', {
    danger: {timeout: 10000},
    warning: {timeout: 5000},
    success: {timeout: 3000},
    info: {timeout: 3000}
  })
;
angular.bootstrap(document, ['sample-app']);
```

```html
# index.html
<div class="global-alerts" ng-cloak>
    <div alert ng-repeat="alert in alerts" type="{{alert.type}}" close="alert.close()">{{alert.msg}}</div>
</div>
```


## Tests

Trigger unit test with [npm](https://www.npmjs.com/)

```sh
$ npm run test
```


## Travis and npmjs

Every push will trigger a test run at travis-ci (node.js-versions: 0.10, 0.12, 4.0, 4.1, 4.2 and 4.3). In case of a 
tagged version and success (node.js 4.3) an automated pbulish to npmjs.org will be triggered by travis-ci.


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


# License

This library is under the [MIT license](https://github.com/MovingImage24/mi-angular-alert-service/blob/master/LICENSE).