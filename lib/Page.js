/*jshint node:true*/
"use strict";

var util = require("util");
var InspectorComponent = require("./InspectorComponent.js");


/**
*  Page component.
*  Represents the browser page
*/
function Page(inspector) {
  InspectorComponent.call(this, inspector, "Page");

  this.messages = [];
}
util.inherits(Page, InspectorComponent);

/**
*  Reload the page
*/
Page.prototype.reload = function(ignoreCache, cb) {
  // there aren't any return parameters so just use the
  // callback we are given
  this.sendMessageToBackend("reload", {
    ignoreCache: ignoreCache || false
  }, cb);
};


module.exports = Page;