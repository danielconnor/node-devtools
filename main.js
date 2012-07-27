"use strict";

var websocket = require("websocket");
var http = require("http");
var Inspector = require("./lib/Inspector.js");


Inspector.getPages("localhost", 9222, function(err, pages) {
  var debuggerUrl = pages[0].webSocketDebuggerUrl;
  console.log(pages);
  var i = new Inspector(debuggerUrl);

  console.log(debuggerUrl);
});