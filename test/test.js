var devtools = require("../main.js");
var http = require("http");
var websocketLib = require("websocket");
var WebSocketServer = websocketLib.server;

var Inspector = devtools.Inspector;
var InspectorProxy = devtools.InspectorProxy;

Inspector.getActivePages("localhost", 9222, function(err, pages) {
  if(pages.length) {

    var debuggerUrl;
    for(var p = 0; p < pages.length; p++) {
      if(/localhost:8888/.test(pages[p].url)) {
        debuggerUrl = pages[p].webSocketDebuggerUrl;
      }
    }

    var i = new InspectorProxy();

    i.on("loaded", function() {

    });

    if(debuggerUrl) {
      i.connect(debuggerUrl, 9333);
      console.log("listening on port: 9333");
    }
  }
});