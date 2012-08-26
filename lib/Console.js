/*jshint node:true*/
"use strict";

var util = require("util");
var InspectorComponent = require("./InspectorComponent.js");


/**
*  Console component.
*  Manages the browser console
*/
function Console(inspector) {
  InspectorComponent.call(this, inspector, "Console");

  this.messages = [];
}
util.inherits(Console, InspectorComponent);

/**
*  Clear all the messages from the console
*/
Console.prototype.clear = function(cb) {
  // there aren't any return parameters so just use the
  // callback we are given
  this.sendMessageToBackend("clear", null, cb);
};

/**
*  Happens when a message is added to the console.
*/
Console.prototype.messageAdded = function(params) {
  // keep a local reference
  this.messages.push(params);
  this.emit("messageadded", params);
  this.emit("message", params);
};

/**
*  Fired when the last message was repeated
*/
Console.prototype.messageRepeatCountUpdated = function(params) {
  var messages = this.messages;
  // update the last message with the lates repeat count
  messages[messages.length - 1].repeatCount = params.count;
  this.emit("messagerepeatcountupdated", params);
  this.emit("messagerepeated", params);
};

/**
*  Happens after the console is cleared using the clear function
*   above or when the page is navigated
*/
Console.prototype.messagesCleared = function() {
  this.emit("cleared");
};

module.exports = Console;