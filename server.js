
var http = require("http");
var fs = require("fs");
var https = require("https");

var bodyParser = require('body-parser');
var express = require('express');
var app = express();

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
        throw err;
      }
      console.log("Got configuration");
      console.log(data.toString());
      
      callback(JSON.parse(data.toString()));
    });
}
var sipEngine = require('./sip_engine.js')(determineIpAddress());
var simulator = require('./simulator.js')(sipEngine);

//sipEngine.makeCall('sip:555@morbo.dev2000.com', "Kevin Glinski", '8723000')
//sipEngine.registerPhones([100], '172.19.33.192');
loadConfigurationFile(function(config){
    simulator.start(config);
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});


var httpServer = http.createServer(app);

var port = 8888;
console.log("starting on " + port);

httpServer.listen(port);
