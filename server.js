var sipEngine = require('./sip_engine.js')();

//sipEngine.makeCall('sip:555@morbo.dev2000.com')
sipEngine.registerPhones([100], '172.19.33.192');

var http = require("http");
var fs = require("fs");
var https = require("https");

var bodyParser = require('body-parser');
var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});


var httpServer = http.createServer(app);

var port = 8888;
console.log("starting on " + port);

httpServer.listen(port);
