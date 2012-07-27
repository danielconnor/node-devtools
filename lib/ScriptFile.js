"use strict";

var EventEmitter = require("events").EventEmitter;
var util = require("util");


function ScriptFile(component, params) {
  EventEmitter.call(this);

  this.component = component;
  this.scriptId = params.scriptId;
  this.url = params.url;
  this.startLine = params.startLine;
  this.startColumn = params.startColumn;
  this.endLine = params.endLine;
  this.endColumn = params.endColumn;
  this.source = null;
}
util.inherits(ScriptFile, EventEmitter);

ScriptFile.prototype.setSource = function(source, cb) {
  var self = this;
  this.component.sendMessageToBackend("setScriptSource", {
    scriptId: this.scriptId,
    scriptSource: source
  }, function(err, result) {
    if(err) {
      return;
    }
    self.updateSource(result.scriptSource);
  });
};

ScriptFile.prototype.getSource = function(cb) {
  var self = this;
  this.component.sendMessageToBackend("getScriptSource", {
    scriptId: this.scriptId
  }, function(err, result) {
    if(err) {
      return;
    }
    self.updateSource(result.scriptSource);
  });
};

ScriptFile.prototype.updateSource = function(source) {
  this.source = source;
  this.emit("sourceupdate", source);
};

module.exports = ScriptFile;