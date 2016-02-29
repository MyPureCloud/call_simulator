#!/usr/bin/env node

var http = require("http");
var fs = require("fs");
var https = require("https");

var bodyParser = require('body-parser');
var express = require('express');
var app = express();
app.use(bodyParser.json());

var _configuration = {};

function determineIpAddress(){

    var os = require('os');
    var ifaces = os.networkInterfaces();

    var ip = '';

    Object.keys(ifaces).forEach(function (ifname) {
      var alias = 0;

      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }

        if (alias >= 1) {
          // this single interface has multiple ipv4 addresses
          console.log(ifname + ':' + alias, iface.address);
        } else {
          // this interface has only one ipv4 adress
          console.log(ifname, iface.address);
        }
        ++alias;

        if(ifname === "en0" || ifname == "eth0" || ifname == "eth1" || ifname == "Ethernet"){
            ip = iface.address;
        }
      });
    });

    //ip = '172.17.50.127'
    return ip;
}

function loadConfigurationFile(callback){
    fs.readFile( __dirname + '/config.json', function (err, data) {
      if (err) {
          _configuration = {
                                edgeServer: {
                                  ip: ""
                                },
                                stations: [

                                ],
                                callSimulator: {
                                  concurrentCalls: "10",
                                  interval: "10",
                                  calls: [
                                    {
                                      to: "555",
                                      fromNumber: "555-555-5555",
                                      fromName: "John Doe"
                                    }
                                  ]
                                }
                            };

      }else{
          console.log("Got configuration");
          console.log(data.toString());
          _configuration = JSON.parse(data.toString());

      }

      callback(_configuration);
    });
}
var ipAddress = determineIpAddress();
var sipEngine = require('./lib/sip_engine.js')(ipAddress);
var simulator = require('./lib/simulator.js')(sipEngine, ipAddress);

//sipEngine.makeCall('sip:555@morbo.dev2000.com', "Kevin Glinski", '8723000')
//sipEngine.registerPhones([100], '172.19.33.192');
loadConfigurationFile(function(config){
    simulator.start(config);
});


app.get('/status', function (req, res) {
    res.setHeader('content-type', 'application/javascript');
    var status = simulator.status();
    status.simIp = ipAddress;
    res.send(status);
});

app.post('/configuration', function (req, res) {
    console.log("new configuration");
    console.log(req.body);
    _configuration = req.body;
    fs.writeFileSync( __dirname + '/config.json', JSON.stringify(_configuration));
    res.send("");
});

app.get('/configuration', function (req, res) {
    res.setHeader('content-type', 'application/javascript');
    res.send(_configuration);
});

app.get('/startsimulation', function (req, res) {
    simulator.start(_configuration);
    res.send();
});

app.get('/stopsimulation', function (req, res) {
    simulator.stop(_configuration);
    res.send();
});


app.all('/dial/:number', function (req, res) {
    var number = req.params.number;
    console.log(_configuration);
    var to = "sip:" + number + "@" + _configuration.edgeServer.ip + ":5060";

    sipEngine.makeCall( to ,
                        "Simulator",
                        "sip:" + number +"@" +ipAddress + ":5060");

    res.send("");
});

app.use(express.static(__dirname + '/public'));

var httpServer = http.createServer(app);

var port = 8888;
console.log("starting on " + port);

var open = require('open');
open('http://localhost:'+port);

httpServer.listen(port);
