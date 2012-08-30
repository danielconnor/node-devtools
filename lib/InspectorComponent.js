/*jshint node:true*/
"use strict";

var util = require("util");
var EventEmitter = require("events").EventEmitter;


function InspectorComponent(inspector, name) {
  EventEmitter.call(this);
  this.inspector = inspector;
  this.enabled = false;
  this.name = name;

  this.events = [];
}

util.inherits(InspectorComponent, EventEmitter);

InspectorComponent.prototype.enable = function(cb) {
  var self = this;
  if(!this.enabled) {
    this.sendMessageToBackend("enable", null, function() {
      self.onEnable();
      if(typeof cb === "function") cb.apply(self, arguments);
    });
  }
  else process.nextTick(cb);
};

InspectorComponent.prototype.sendMessageToBackend = function(method, params, cb) {
  var self = this;
  this.inspector.sendMessageToBackend(this.name + "." + method, params, function() {
    if(typeof cb === "function") cb.apply(self, arguments);
  });
};

InspectorComponent.prototype.onEnable = function() {
  this.enabled = true;
  this.emit("enabled");
};

InspectorComponent.prototype.handleEvent = function(evtName, params) {
  this.events.push({
    method: this.name + "." + evtName,
    params: params
  });

  if(typeof this[evtName] === "function") {
    this[evtName](params);
  }
};

module.exports = InspectorComponent;