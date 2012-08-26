var devtools = require("../main.js");
var http = require("http");
var websocketLib = require("websocket");
var WebSocketServer = websocketLib.server;

var Inspector = devtools.Inspector;
var InspectorProxy = devtools.InspectorProxy;

Inspector.getActivePages("localhost", 9222, function(err, pages) {
  if(pages.length) {
    var debuggerUrl = pages[0].webSocketDebuggerUrl,
      i = new InspectorProxy();

    i.on("loaded", function() {

    });

    i.connect(debuggerUrl, 9333);
  }
});

// Inspector.getActivePages("localhost", 9222, function(err, pages) {
//   if(pages.length) {

//     var debuggerUrl = pages[0].webSocketDebuggerUrl,
//       i = new Inspector(debuggerUrl),
//       dbg = i.components.Debugger,
//       c = i.components.Console,
//       files = [];

//     var server = http.createServer(function(request, response) {});
//     server.listen(8080, function() {});

//     wsServer = new WebSocketServer({
//         httpServer: server,
//         autoAcceptConnections: false
//     });

//     dbg.on("scriptparsed", function(file) {
//       // console.log(file.url);

//       if(file.url === "http://localhost:8888/app/test.js") {
//         file.setSource("function doStuff(e) { console.log('hello world');}", function(err, res) {
//           console.log(res.result);
//         });
//       }
//     });


//     wsServer.on('request', function(request) {
//       i.socket.on("connect",function(connection) {
//         var c = request.accept(null);
//         c.socket.pipe(connection.socket);
//         connection.socket.pipe(c.socket);

//         i.init(connection);
//       });

//       i.socket.connect(i.wsUrl);
//     });


//   }
// });