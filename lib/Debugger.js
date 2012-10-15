/*jshint node:true*/
"use strict";

var util = require("util");
var InspectorComponent = require("./InspectorComponent.js");
var ScriptFile = require("./ScriptFile.js");


/**
*  Debugger component.
*  Manages scripts and breakpoints
*/
function Debugger(inspector) {
  InspectorComponent.call(this, inspector, "Debugger");

  this.scripts = {};
}
util.inherits(Debugger, InspectorComponent);

Debugger.prototype.canSetScriptSource = function(cb) {
  this.sendMessageToBackend("canSetScriptSource", null, function(err, result) {
    if(err) {
      return cb(err);
    }

    return cb(err, result.result);
  });
};

Debugger.prototype.scriptParsed = function(params) {
  var scriptFile = this.scripts[params.url];

  if(scriptFile !== undefined) {
    scriptFile.init(params);
  }
  else {
    this.scripts[params.url] = scriptFile = new ScriptFile(this, params);
  }

  this.emit("scriptparsed", scriptFile);
};

Debugger.prototype.stepOver = function(cb) {
  this.sendMessageToBackend("stepOver", cb);
};

Debugger.prototype.paused = function(params) {
  this.emit("paused", params);
};


Debugger.prototype.scriptFailedToParse = function(params) {
  console.log("failed to parse");
  console.log(params);
};

module.exports = Debugger;