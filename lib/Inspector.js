/*jshint node:true*/
"use strict";

var websocketLib = require("websocket");
var WebSocket = websocketLib.client;

var EventEmitter = require("events").EventEmitter;
var InspectorComponent = require("./InspectorComponent");

var http = require("http");
var util = require("util");
var utils = require("./utils");


/**
*  Inspector constructor function
*  An inspector manages the connection between the backend and itself
*  Including all events and requests and responses
*
*  @param {String} wsUrl The WebSocket url of the inspectable page
*/
function Inspector(wsUrl) {
  EventEmitter.call(this);

  this.wsUrl = wsUrl;
  this.socket = new WebSocket();

  this.socket.on("connect", this.init.bind(this));
  this.socket.on("connectFailed", this.handleError.bind(this));


  // stores all components for the inspector, so they can be
  // dispatched to easily
  this.components = {};

  // a queue to buffer requests until the inspector has connected
  //this.requestQueue = null;

  // acts as an id for each request so we know when we get a
  // response from one
  this.lastRequest = 0;
  // store for callbacks to requests to the backend
  this.requests = {};
}
util.inherits(Inspector, EventEmitter);

var componentCtrs =
Inspector.componentCtrs = {
  "Inspector": InspectorComponent,
  "Page": InspectorComponent,
  "Debugger": require("./Debugger"),
  "CSS": InspectorComponent,
  "Runtime": require("./Runtime"),
  "Console": require("./Console"),
  "Network": InspectorComponent,
  "Database": InspectorComponent,
  "IndexedDB": InspectorComponent,
  "DOMStorage": InspectorComponent,
  "ApplicationCache": InspectorComponent,
  "FileSystem": InspectorComponent,
  "DOM": InspectorComponent,
  "Timeline": InspectorComponent,
  "DOMDebugger": InspectorComponent,
  "Profiler": InspectorComponent,
  "Worker": InspectorComponent,
  "WebGL": InspectorComponent
};



/**
*  Connect the websocket
*
*  @param {String} wsUrl The WebSocket url of the inspectable page
*   (Optional)
*/
Inspector.prototype.connect = function(wsUrl) {
  this.wsUrl = wsUrl = wsUrl || this.wsUrl;

  if(!wsUrl) {
    throw new Error("A Websocket url must be specified");
  }

  this.socket.connect(wsUrl);
};


/**
*  Get a list pages that are available to be debugged
*
*  @param {String} host The host to request the list from
*  @param {Number} port The port that the debugger is running on
*  @param {Function} cb
*         @param {Array} list A list of JSON objects in the format:
*  {
*    devtoolsFrontendUrl: '',
*    faviconUrl: '',
*    thumbnailUrl: '',
*    title: '',
*    url: '',
*    webSocketDebuggerUrl: ''
*  }
*
*/
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
    hostname: host,
    port: port,
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

/**
*  Same as Inspector.getPages except returns pages that can be
*  connected to.
*/
Inspector.getActivePages = function(host, port, cb) {
  Inspector.getPages(host, port, function(err, pages) {
    if(err) {
      return cb(err);
    }
    var activePages = [];

    for(var i = 0, il = pages.length; i < il; i++) {
      var page = pages[i];
      if(page.webSocketDebuggerUrl !== undefined) {
        activePages.push(page);
      }
    }

    return cb(null, activePages);
  });
};

Inspector.prototype.handleError = function(e) {
  this.emit("error", e);
};

/**
*  Initialise the Inspector when a WebSocket Connection has
*  been established.
*
*  @param {WebSocketConnection} connection The WebSocket connection
*/
Inspector.prototype.init = function(connection) {
  var self = this;

  this.connection = connection;

  connection.on("message", this.parseMessage.bind(this));
  connection.on("error", this.handleError.bind(this));
  connection.on("close", this.close.bind(this));

  // send all the requests from the requestQueue
  var requestQueue = this.requestQueue;
  if(requestQueue) {
    var ql = requestQueue.length;
    while(ql--) {
      connection.sendUTF(JSON.stringify(requestQueue[ql]));
    }
    this.requestQueue = null;
  }

  this.emit("loaded");
};

/**
*  Lazy create components when they are requested
*
*  @param {String} cmpName The name of the component to be returned.
*/
Inspector.prototype.getCmp =
Inspector.prototype.getComponent = function(cmpName) {
  var component = this.components[cmpName];

  if(component === undefined && componentCtrs[cmpName]) {
    component = this.components[cmpName] = new componentCtrs[cmpName](this, cmpName);
  }
  return component;
};

/**
*  Parse an incoming message on the WebSocket connection
*
*  @param {Object} message The message to parse
*/
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


/**
*  Decide what to do with a message after it has been parsed
*
*  @param {Object} message The parsed JSON object which contains parameters from the
*    backend as defined by the debugging protocol <https://developers.google.com/chrome-developer-tools/docs/protocol/1.0/index>
*/
Inspector.prototype.handleMessage = function(message) {
  // if the message contains an id, the message is a
  // response to a request
  if(message.id !== undefined && !message.method && this.requests[message.id]) {

    // call the callback that was stored when the request was made
    // with either the error and result
    this.requests[message.id](message.error || null, message.result);
    // remove the callback
    this.requests[message.id] = null;
  }
  else if(message.method && message.id !== undefined) {
    console.log(message) ;
  }
  else if(message.method && message.params) {
    // we got an event initiated by the backend
    this.parseEvent(message.method, message.params);
  }
  else if(message.error) {
    console.log(message.error);
  }
};

/**
*  Send a message to the backend
*
*  @param {String} method The method to invoke on the backend
*  @param {Object} params The parameters to pass to the backend method
*/
Inspector.prototype.sendMessageToBackend = function(method, params, cb) {
  // increment the lastRequest id so it's always unique
  var id = ++this.lastRequest,
    req = {
      id: id,
      method: method,
      params: params
    };

  // retain the callback so we can call it later, when
  // the backend gives a response
  this.requests[id] = cb;

  // buffer the request if we haven't connected yet.
  if(!this.connection) {
    // only create the queue on demand.
    // the likelihood is that no-one will ever try make a request
    // before connecting.
    if(!this.requestQueue) {
      this.requestQueue = [req];
    }
    else this.requestQueue.unshift(req);
  }
  else this.connection.sendUTF(JSON.stringify(req));
};

/**
*  Split the method name recieved in an event to get the component
*  and dispatch the event to that component
*
*  @param {String} methodName The name of the event called by the backend
*  @param {Object} params A JSON object containing the arguments of the event
*/
Inspector.prototype.parseEvent = function(method, params) {
  // the method name is always in the form {Component}.{Method}
  // so to get the component we split by '.'
  var methodParts = utils.parseMethod(method);

  this.handleEvent(method, methodParts.component, methodParts.method, params);
};


Inspector.prototype.handleEvent = function(method, componentName, methodName, params) {
  var component = this.components[componentName];
  if(component) {
    component.handleEvent(methodName, params);
  }
};

/**
*  Asynchronously enable components
*
*  @param {Array} componentNames A list of components to enable
*  @param {Function} cb A callback for when all the components
*   have been enabled. It has no arguments.
*/
Inspector.prototype.enableComponents = function(componentNames, cb) {
  var enabled = 0,
    self = this;

  function incrementEnabled() {
    if(++enabled === componentNames.length) {
      if(typeof cb === "function") cb.call(self);
    }
  }

  for(var i = 0, il = componentNames.length; i < il; i++) {
    var component = this.getCmp(componentNames[i]);
    if(component) {
      component.enable(incrementEnabled);
    }
  }
};

Inspector.prototype.close = function() {
  // TODO: actually close everything
  this.emit("close");
};


module.exports = Inspector;