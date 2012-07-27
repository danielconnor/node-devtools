"use strict";

var WebSocket = require("websocket").client;
var EventEmitter = require("events").EventEmitter;
var Debugger = require("./Debugger");
var http = require("http");
var util = require("util");

function Inspector(ws) {
  EventEmitter.call(this);

  this.socket = new WebSocket();
  this.connected = false;

  this.socket.on("connect", this.init.bind(this));
  this.socket.on("connectFailed", this.handleError.bind(this));

  this.socket.connect(ws);

  this.components = {
    Debugger: new Debugger(this)
  };

  this.lastRequest = 0;
  this.requests = {};
}
util.inherits(Inspector, EventEmitter);

Inspector.getPages = function(host, port, cb) {
  if(typeof host === "function") {
    cb = host;
    host = "localhost";
    port = 9222;
  }
  else if(typeof port === "function") {
    cb = port;
    port = host;
    host = "localhost";
  }
  
  http.get({
    hostname: "localhost",
    port: 9222,
    path: "/json"
  }, function(response) {
    var jsonString = "";

    response.on("data", function(chunk) {
      jsonString += chunk.toString();
    });

    response.on("end", function() {
      var jsonData;

      try {
        jsonData = JSON.parse(jsonString);
      }
      catch(e) {
        return cb(e);
      }

      cb(null, jsonData);
    });
  }).on("error", cb);
};


Inspector.prototype.handleError = function(e) {
  this.emit("error", e);
};

Inspector.prototype.init = function(connection) {
  this.connection = connection;

  connection.on("message", this.parseMessage.bind(this));
  connection.on("error", this.handleError.bind(this));
  connection.on("close", this.close.bind(this));

  this.enableComponents([
    "Debugger"
  ], function() {
    console.log("components enabled");
  });

  this.emit("loaded");
};

Inspector.prototype.enableComponents = function(componentNames, cb) {
  var components = this.components,
    enabled = 0;

  function incrementEnabled() {
    if(++enabled === componentNames.length) {
      if(typeof cb === "function") cb();
    }
  }

  for(var i = 0, il = componentNames.length; i < il; i++) {
    var component = components[componentNames];
    if(component) {
      component.enable(incrementEnabled);
    }
  }
};

Inspector.prototype.parseMessage = function(message) {
  if(message.type === "utf8") {
    try {
      this.handleMessage(JSON.parse(message.utf8Data));
    }
    catch(e) {
      this.handleError(e);
    }
  }
  else {
    this.handleError(new Error("Recieved incorrect message type"));
  }
};
Inspector.prototype.handleMessage = function(message) {
  // if the message contains an id, the message is a
  // response to a request
  if(message.id) {
    // call the callback that was stored when the request was made
    // with either the error and result
    this.requests[message.id](message.error || null, message.result);
    // remove the callback
    delete this.requests[message.id];
  }
  else if(message.method && message.params) {
    // we got an event initiated by the backend
    this.delegateEvents(message.method, message.params);
  }
  else if(message.error) {
    console.log(message.error);
  }
};


Inspector.prototype.sendMessageToBackend = function(method, params, cb) {
  var id = ++this.lastRequest,
    req = {
      id: id,
      method: method,
      params: params
    };

  // retain the callback so we can call it later, when
  // the backend gives a response
  this.requests[id] = cb;

  this.connection.sendUTF(JSON.stringify(req));
};

Inspector.prototype.delegateEvents = function(methodName, params) {
  var parts = methodName.split("."),
    componentName = parts[0],
    method = parts[1],
    component = this.components[componentName];

  if(component) {
    component.handleEvent(method, params);
  }
};

Inspector.prototype.close = function() {
  this.emit("close");
};

module.exports = Inspector;