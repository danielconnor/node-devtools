"use strict";

var util = require("util");
var InspectorComponent = require("./InspectorComponent.js");
var ScriptFile = require("./ScriptFile.js");

function Debugger(inspector) {
  InspectorComponent.call(this, inspector, "Debugger");

  this.scripts = {};
}
util.inherits(Debugger, InspectorComponent);

Debugger.prototype.scriptParsed = function(params) {
  this.scripts[params.scriptId] = new ScriptFile(this, params);
};

module.exports = Debugger;