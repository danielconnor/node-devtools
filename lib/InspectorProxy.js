/*jshint node:true*/
"use strict";

var websocketLib = require("websocket");
var WebSocket = websocketLib.client;
var WebSocketServer = websocketLib.server;

var EventEmitter = require("events").EventEmitter;
var Inspector = require("./Inspector");
var InspectorClient = require("./InspectorClient");
var InspectorComponent = require("./InspectorComponent");

var http = require("http");
var util = require("util");
var utils = require("./utils");


var components = [
  "Inspector",
  "Page",
  "Debugger",
  "CSS",
  "Runtime",
  "Console",
  "Network",
  "Database",
  "IndexedDB",
  "DOMStorage",
  "ApplicationCache",
  "FileSystem",
  "DOM",
  "Timeline",
  "DOMDebugger",
  "Profiler",
  "Worker",
  "WebGL"
];

function InspectorProxy(wsUrl) {
  Inspector.call(this, wsUrl);

  this.server = http.createServer(function(request, response) {
    response.end();
  });

  this.wsServer = new WebSocketServer({
    httpServer: this.server,
    autoAcceptConnections: false
  });

  this.wsServer.on("request", this.handleConnectRequest.bind(this));

  this.clients = [];
}
util.inherits(InspectorProxy, Inspector);

var _super = Inspector.prototype;

InspectorProxy.prototype.connect = function(wsUrl, port) {
  _super.connect.call(this, wsUrl);
  this.server.listen(port);
};


InspectorProxy.prototype.handleConnectRequest = function(request) {
  var client = new InspectorClient(request.accept(null), this);

  console.log("got client");
  this.clients.push(client);
};

InspectorProxy.prototype.handleEvent = function(method, componentName, methodName, params) {
  _super.handleEvent.apply(this, arguments);
  var clients = this.clients,
    cl = this.clients.length;

  while(cl--) {
    clients[cl].sendMessageToClient({
      method: method,
      params: params
    });
  }

};

module.exports = InspectorProxy;