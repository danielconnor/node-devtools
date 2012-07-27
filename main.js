"use strict";

var websocket = require("websocket");
var http = require("http");
var Inspector = require("./lib/Inspector.js");

function getPages(cb) {

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
}


getPages(function(err, pages) {
  var debuggerUrl = pages[0].webSocketDebuggerUrl;

  var i = new Inspector(debuggerUrl);

  console.log(debuggerUrl);
});