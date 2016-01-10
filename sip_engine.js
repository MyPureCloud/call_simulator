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

        if(ifname === "en0" || ifname == "eth0" || ifname == "eth1" || ifname == "Ethernet"){
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
    var ipAddress = determineIpAddress();
//node make_call.js 'sut <sip:[service]@[remote_ip]:[remote_port]>'


    var dialogs = {};
    var stations = [];
    var busyNumber = '5556666';

    function rstring() { return Math.floor(Math.random()*1e6).toString(); }
    function getId(rq){ return [rq.headers['call-id'], rq.headers.from.params.tag].join(':'); }
    function handleSipRequest(rq){
      try{
        console.log('got message ' +  JSON.stringify(rq));
        var id = getId(rq);

        if(rq.headers.to.params.tag) { // check if it's an in dialog request

            if(dialogs[id]){
                dialogs[id](rq);
            }
            else{
                console.log(rq.method);
                console.log("call doesn't exist");
                sip.send(sip.makeResponse(rq, 481, "Call doesn't exist"));
            }

        }

        switch (rq.method) {
            case 'INVITE': {
              //  var ringing = sip.makeResponse(rq, 180, 'Ringing');
                var user = sip.parseUri(rq.headers.to.uri).user;
                console.log("INVITE for " + user);

                if(user.indexOf(busyNumber) > -1){
                  setTimeout(function () {
                       var busy = sip.makeResponse(rq, 486, 'Busy Here');
                       sip.send(busy);
                   }, 1300);
                }else{
                  //INVITE for a station or a normal call
                  var trying = sip.makeResponse(rq, 100, 'Trying');
                  var to = trying.headers.to;
                  trying.headers.contact = [{uri: to.uri}]
                  sip.send(trying);

                  var ok = sip.makeResponse(rq, 200, "OK");
                  ok.headers.contact = [{uri: to.uri}];
                  ok.headers.supported = "100rel, replaces",
                  ok.headers.allow= ["INVITE", "ACK", "BYE", "CANCEL", "OPTIONS", "INFO", "MESSAGE", "SUBSCRIBE", "NOTIFY", "PRACK", "UPDATE", "REFER"],
                  ok.headers['Accept-Language'] = 'en';
                  ok.headers['Content-Type'] = "application/sdp";
                  ok.content=
                    'v=0\r\n'+
                    'o=- 13374 13374 IN IP4 '+ ipAddress +'\r\n'+
                    's=Polycom IP Phone\r\n'+
                    'c=IN IP4 '+ ipAddress +'\r\n'+
                    't=0 0\r\n'+
                    'm=audio 16424 RTP/AVP 0 8 101\r\n'+
                    'a=rtpmap:0 PCMU/8000\r\n'+
                    'a=rtpmap:8 PCMA/8000\r\n'+
                    'a=rtpmap:101 telephone-event/8000\r\n'+
                    'a=fmtp:101 0-15\r\n'+
                    'a=ptime:30\r\n'+
                    'a=sendrecv\r\n';
                    sip.send(ok);
                }

                break;
            }
            case 'BYE' :{
              console.log('call received bye');
              console.log("ending call " + id);
              delete dialogs[id];

              sip.send(sip.makeResponse(rq, 200, 'Ok'));
            }

            case 'ACK': {
                break;
            }

            default: {
                sip.send(sip.makeResponse(rq, 405, 'Method not allowed'));
            };
        }
      }catch(err){
        console.log("ERROR " + JSON.stringify(err));
        console.log(new Error().stack);
      }
    }

    //starting stack
    sip.start({}, handleSipRequest);

    function handleInCallMethods(rq){
        var id = getId(rq);
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
        for(var index in stationList){
            var station = stationList[index];
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

/*
    function sendInvite(to,from, contactUri, callback){

        callback);

    }*/
    // Making the call
    function makeCallImpl(to, remoteName, remoteNumber){

        //sendInvite(to, remoteNumber, "sip:101@" + ipAddress,
        sip.send({
            method: 'INVITE',
            uri: to,
            headers: {
              to: {uri: to},
              from: {uri: remoteNumber, params: {tag: rstring()}, name: remoteName},
              'call-id': rstring(),
              cseq: {method: 'INVITE', seq: Math.floor(Math.random() * 1e5)},
              'content-type': 'application/sdp',
              contact: [{uri: "sip:101@" + ipAddress,}]
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

                var id = getId(rs);

                // registring our 'dialog' which is just function to process in-dialog requests
                if(!dialogs[id]) {
                  dialogs[id] = handleInCallMethods;
                }
              }
            });
    }

    return {
      makeCall: function(to, remoteName, remoteNumber) {
          return makeCallImpl(to, remoteName, remoteNumber);
      },
      registerPhones:function(stationList, serverIp){
          return registerPhonesImpl(stationList, serverIp);
      }
    };
}
