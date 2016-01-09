// Initiating a call example. Note: we use bogus sdp, so no real rtp session will be established.

//  https://gist.github.com/mheadd/906216

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

        if(ifname === "en0" || ifname == "eth0" || ifname == "eth1" ){
            ip = iface.address;
        }
      });
    });

    //ip = '172.17.50.127'
    return ip;
}

var sip = require('sip');
var util = require('util');
var os = require('os');

module.exports = function(){

//node make_call.js 'sut <sip:[service]@[remote_ip]:[remote_port]>'


    var dialogs = {};

    function rstring() { return Math.floor(Math.random()*1e6).toString(); }

    function handleSipRequest(rq){
        console.log('got message ' +  JSON.stringify(rq));

        if(rq.headers.to.params.tag) { // check if it's an in dialog request
            var id = [rq.headers['call-id'], rq.headers.to.params.tag, rq.headers.from.params.tag].join(':');

            if(dialogs[id]){
                dialogs[id](rq);
            }
            else{
                console.log(rq.method);
                console.log("call doesn't exist");
                sip.send(sip.makeResponse(rq, 481, "Call doesn't exist"));
            }

        }

        switch (request.method) {
            case 'INVITE': {
                var ringing = sip.makeResponse(request, 180, 'Ringing');
                sip.send(ringing);

                setTimeout(function () {
                    var busy = sip.makeResponse(request, 486, 'Busy Here');
                    sip.send(busy);
                }, 1300);

                break;
            }

            case 'ACK': {
                break;
            }

            default: {
                sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
            };
        }

    }

    //starting stack
    sip.start({}, handleSipRequest);

    function handleInCallMethods(rq){
        console.log('in call method ' + JSON.stringify(rq));
        if(rq.method === 'BYE') {
          console.log('call received bye');

          delete dialogs[id];

          sip.send(sip.makeResponse(rq, 200, 'Ok'));
        }
        else {
          sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
        }

    }

    function sendAck(uri, to, from, callid, seq){
        // sending ACK
        sip.send({
          method: 'ACK',
          uri: uri,
          headers: {
            to: to,
            from: from,
            'call-id': callid,
            cseq: {method: 'ACK', seq: seq},
            via: []
          }
        });
    }

    function registerPhonesImpl(stationList, serverIp){
        var ipAddress = determineIpAddress();

        for(var station in stationList){
            console.log("registering phone " + station);
            var to = station;
            var port = 5060;


            var register = {
              method : 'REGISTER',
              uri : 'sip:' + to + '@' + serverIp + ':' + port,
              headers: {
                to : { uri : 'sip:' + to + '@' + serverIp + ':' + port },
                from: {uri: 'sip:test@test', params: {tag: rstring()}},
                'call-id': rstring(),
                cseq: { method : 'REGISTER', seq: Math.floor(Math.random() * 1e5) },
                contact : [ { uri: 'sip:' + to + '@' + ipAddress } ],
                'Max-Forwards': 70
              }
            };

            sip.send(register, function(rs) {
                console.log("registration of " + to + " " + rs.status);
    /*
              sip.destroy();
              return res.json({
                result:ress
              })
              */
            });
        }
    }


    function sendInvite(to,from, contactUri, callback){
        sip.send({
          method: 'INVITE',
          uri: to,
          headers: {
            to: {uri: to},
            from: {uri: from, params: {tag: rstring()}},
            'call-id': rstring(),
            cseq: {method: 'INVITE', seq: Math.floor(Math.random() * 1e5)},
            'content-type': 'application/sdp',
            contact: [{uri: contactUri}]
          },
          content:
            'v=0\r\n'+
            'o=- 13374 13374 IN IP4 172.16.2.2\r\n'+
            's=-\r\n'+
            'c=IN IP4 172.16.2.2\r\n'+
            't=0 0\r\n'+
            'm=audio 16424 RTP/AVP 0 8 101\r\n'+
            'a=rtpmap:0 PCMU/8000\r\n'+
            'a=rtpmap:8 PCMA/8000\r\n'+
            'a=rtpmap:101 telephone-event/8000\r\n'+
            'a=fmtp:101 0-15\r\n'+
            'a=ptime:30\r\n'+
            'a=sendrecv\r\n'
        },
        callback);

    }
    // Making the call
    function makeCallImpl(to){
        var ipAddress = determineIpAddress();
        console.log("starting on IP " + ipAddress );

        sendInvite(to, "sip:test@test", "sip:101@" + ipAddress,
            function(rs) {

              if(rs.status >= 300) {
                console.log('call failed with status ' + rs.status);
              }
              else if(rs.status < 200) {
                console.log('call progress status ' + rs.status);
              }
              else {

                // yes we can get multiple 2xx response with different tags
                console.log('call answered with tag ' + rs.headers.to.params.tag);

                sendAck(rs.headers.contact[0].uri, rs.headers.to, rs.headers.from, rs.headers['call-id'], rs.headers.cseq.seq);

                var id = [rs.headers['call-id'], rs.headers.from.params.tag, rs.headers.to.params.tag].join(':');

                // registring our 'dialog' which is just function to process in-dialog requests
                if(!dialogs[id]) {
                  dialogs[id] = handleInCallMethods;
                }
              }
            });
    }

    return {
      makeCall: function(to, remoteName) {
          return makeCallImpl(to);
      },
      registerPhones:function(stationList, serverIp){
          return registerPhonesImpl(stationList, serverIp);
      }
    };
}
