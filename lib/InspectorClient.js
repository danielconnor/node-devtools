/*jshint node:true*/
"use strict";

var util = require("util");
var utils = require("./utils");
var EventEmitter = require("events").EventEmitter;


function InspectorClient(connection, proxy) {
  EventEmitter.call(this);

  this.connection = connection;
  this.proxy = proxy;

  this.connection.on("message", this.parseMessage.bind(this));
}

util.inherits(InspectorClient, EventEmitter);

InspectorClient.prototype.handleMessage = function(message) {
  var self = this;
  // the message going to the backend should always have a method property
  // so we parse it and see if it's an enable method. For enable methods
  // we don't need to notify the backend that it's being enabled again if it
  // has already been enabled. We also need to notify the frontend of any
  // events for this component that have been fired already and sent to other
  // clients.

  var methodParts = utils.parseMethod(message.method);

  if(methodParts.method === "enable") {
    var component = this.proxy.getCmp(methodParts.component),
      replay = component.enabled;

    component.enable(function() {
      self.sendMessageToClient({
        id: message.id
      });

      // replay all the components events to the new client if the client
      // was enabled before. If it hasn't been enabled before
      // it will receive the events naturally as they come from the
      // backend
      if(replay) {
        var events = component.events;
        for(var i = 0, il = events.length; i < il; i++) {
          console.log(events[i]);
          self.sendMessageToClient(events[i]);
        }
      }
    });

  }
  else {
    this.proxy.sendMessageToBackend(message.method, message.params, function(err, result) {
      self.sendMessageToClient({
        id: message.id,
        error: err || undefined,
        result: result
      });
    });
  }
};

InspectorClient.prototype.parseMessage = function(message) {
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

InspectorClient.prototype.sendMessageToClient = function(message) {
  this.connection.sendUTF(JSON.stringify(message));
};

InspectorClient.prototype.handleError = function(error) {
  console.log(error);
};

module.exports = InspectorClient;