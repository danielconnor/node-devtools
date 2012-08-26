/*jshint node:true*/
"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");


function ScriptFile(component, params) {
  EventEmitter.call(this);

  this.component = component;

  // the url is never expected to change throughout the
  // lifetime of the debugger
  this.url = params.url;

  this.init(params);
}
util.inherits(ScriptFile, EventEmitter);

ScriptFile.prototype.init = function(params) {
  this.scriptId = params.scriptId;
  this.startLine = params.startLine;
  this.startColumn = params.startColumn;
  this.endLine = params.endLine;
  this.endColumn = params.endColumn;
  this.source = this.source || null;
};

ScriptFile.prototype.setSource = function(source, cb) {
  var self = this;
  this.component.sendMessageToBackend("setScriptSource", {
    scriptId: this.scriptId,
    scriptSource: source
  }, function(err, result) {
    if(err) {
      if(cb) return cb(err);
    }
    self.updateSource(result.scriptSource);
    if(cb) return cb(null, result);
  });
};

ScriptFile.prototype.getSource = function(cb) {
  var self = this;
  this.component.sendMessageToBackend("getScriptSource", {
    scriptId: this.scriptId
  }, function(err, result) {
    if(err) {
      if(cb) return cb(err);
    }
    self.updateSource(result.scriptSource);
    if(cb) return cb(null, result.scriptSource);
  });
};

ScriptFile.prototype.updateSource = function(source) {
  this.source = source;
  this.emit("updatesource", source);
};

module.exports = ScriptFile;