/*jshint node:true*/
"use strict";

var util = require("util");
var InspectorComponent = require("./InspectorComponent.js");


/**
*  Runtime component.
*/
function Runtime(inspector) {
  InspectorComponent.call(this, inspector, "Runtime");
}
util.inherits(Runtime, InspectorComponent);

Runtime.prototype.getProperties = function(objectId, cb) {
  this.sendMessageToBackend("getProperties", {
    objectId: objectId,
    ownProperties: true
  }, cb);
};

Runtime.prototype.evaluate = function(expression, cb) {
  this.sendMessageToBackend("evaluate", {
    expression: expression
  }, cb);
};

Runtime.prototype.callFunctionOn = function(objectId) {
  this.sendMessageToBackend("callFunctionOn");
};

module.exports = Runtime;