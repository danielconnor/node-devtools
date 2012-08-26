/*jshint node:true*/
"use strict";

var util = require("util");
var EventEmitter = require("events").EventEmitter;


function InspectorComponent(inspector, name) {
  EventEmitter.call(this);
  this.inspector = inspector;
  this.enabled = false;
  this.name = name;
}

util.inherits(InspectorComponent, EventEmitter);

InspectorComponent.prototype.enable = function(cb) {
  if(!this.enabled) {
    this.sendMessageToBackend("enable", {}, cb);
  }
  else return cb();
};

InspectorComponent.prototype.sendMessageToBackend = function(method, params, cb) {
  var self = this;
  this.inspector.sendMessageToBackend(this.name + "." + method, params, function() {
    self.onEnable.apply(self, arguments);
    if(typeof cb === "function") cb.apply(self, arguments);
  });
};

InspectorComponent.prototype.onEnable = function() {
  this.enabled = true;
  this.emit("enabled");
};

InspectorComponent.prototype.handleEvent = function(evt, params) {
  if(typeof this[evt] === "function") {
    this[evt](params);
  }
  else {
    this.emit("error", new Error("Recieved event for which no handler was defined:" + evt));
  }
};

module.exports = InspectorComponent;