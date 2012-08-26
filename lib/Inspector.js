/*jshint node:true*/
"use strict";

var websocketLib = require("websocket");
var WebSocket = websocketLib.client;

var EventEmitter = require("events").EventEmitter;
var InspectorBase = require("./InspectorBase");
var Debugger = require("./Debugger");
var Console = require("./Console");

var http = require("http");
var util = require("util");


/**
*  Inspector constructor function
*  An inspector manages the connection between the backend and itself
*  Including all events and requests and responses
*
*  @param {String} wsUrl The WebSocket url of the inspectable page
*/
function Inspector(wsUrl) {
  InspectorBase.call(this);

  this.wsUrl = wsUrl;
  this.socket = new WebSocket();

  this.socket.on("connect", this.init.bind(this));
  this.socket.on("connectFailed", this.handleError.bind(this));


  // stores all components for the inspector, so they can be
  // dispatched to easily
  this.components = {
    Debugger: new Debugger(this),
    Console: new Console(this)
  };

  // a queue to buffer requests until the inspector has connected
  //this.requestQueue = null;

  // acts as an id for each request so we know when we get a
  // response from one
  this.lastRequest = 0;
  // store for callbacks to requests to the backend
  this.requests = {};
}
util.inherits(Inspector, InspectorBase);
var _super = InspectorBase.prototype;

Inspector.getPages = InspectorBase.getPages;
Inspector.getActivePages = InspectorBase.getActivePages;

/**
*  Initialise the Inspector when a WebSocket Connection has
*  been established.
*
*  @param {WebSocketConnection} connection The WebSocket connection
*/
Inspector.prototype.init = function(connection) {
  this.enableComponents([
    "Debugger",
    "Console"
  ], function() {

  });

  _super.init.call(this, connection);
};

/**
*  Asynchronously enable components
*
*  @param {Array} componentNames A list of components to enable
*  @param {Function} cb A callback for when all the components
*   have been enabled. It has no arguments.
*/
Inspector.prototype.enableComponents = function(componentNames, cb) {
  var components = this.components,
    enabled = 0,
    self = this;

  function incrementEnabled() {
    if(++enabled === componentNames.length) {
      if(typeof cb === "function") cb.call(self);
    }
  }

  for(var i = 0, il = componentNames.length; i < il; i++) {
    var component = components[componentNames[i]];
    if(component) {
      component.enable(incrementEnabled);
    }
  }
};


Inspector.prototype.close = function() {
  this.emit("close");
};

module.exports = Inspector;