/*jshint node:true*/
"use strict";

var util = require("util");
var InspectorComponent = require("./InspectorComponent");


function InspectorProxyComponent(inspector, name) {
  InspectorComponent.call(this, inspector, name);

  this.events = [];
}

util.inherits(InspectorProxyComponent, InspectorComponent);

InspectorComponent.prototype.onEnable = function() {
  this.enabled = true;
  this.emit("enabled");
};

InspectorComponent.prototype.handleEvent = function(evtName, params) {
  this.events.push({
    method: this.name + "." + evtName,
    params: params
  });
};

module.exports = InspectorProxyComponent;