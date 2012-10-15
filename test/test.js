var devtools = require("../main.js");
var http = require("http");
var websocketLib = require("websocket");
var WebSocketServer = websocketLib.server;

var Inspector = devtools.Inspector;

Inspector.getActivePages("localhost", 9222, function(err, pages) {
  if(pages.length) {

    var debuggerUrl;
    for(var p = 0; p < pages.length; p++) {
      if(/localhost:8080/.test(pages[p].url)) {
        debuggerUrl = pages[p].webSocketDebuggerUrl;
      }
    }

    var i = new Inspector();

    i.on("loaded", function() {
      console.log("inspector loaded");
      var components = ["Debugger", "Runtime"];
      console.log("enabling components", components);

      i.enableComponents(components, function() {
        console.log("components enabled");

        var Debugger = i.getCmp("Debugger");
        var Runtime = i.getCmp("Runtime");

        Debugger.on("paused", function(params) {
          var callFrames = params.callFrames;
          for(var i = 0; i < callFrames.length; i++) {
            console.log(callFrames[i].functionName);
          }
          Debugger.stepOver();
        });


        Runtime.evaluate("branches(1)", function(err, data) {
          console.log(arguments);
        });
      });
    });

    if(debuggerUrl) {
      i.connect(debuggerUrl, 9333);
    }
  }
});