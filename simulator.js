module.exports = function(sipEngine){

    var status = {
        simulation:{
            callsPlaced: 0,
            callsReceived: 0,
        },
        stations:{
            registeredPhoneList:[]
        }
    };

    var outboundCallIndex = 0;
    var outboundCallInterval = null;

    function outboundCallSim(configuration){
        console.log("checking outbound calls current: " + sipEngine.getCurrentOutboundCallCount() + " max: "+ configuration.callSimulator.concurrentCalls);

        if(sipEngine.getCurrentOutboundCallCount() < configuration.callSimulator.concurrentCalls){

            var outboundCall = configuration.callSimulator.calls[outboundCallIndex];
            outboundCallIndex = outboundCallIndex + 1;
            outboundCallIndex = outboundCallIndex % configuration.callSimulator.calls.length;

            console.log("placing call to " + outboundCall.to);

            sipEngine.makeCall(outboundCall.to, outboundCall.fromName, outboundCall.fromNumber);
        }
    }

    function startSimulation(configuration){
        console.log("Starting sim, interval " + configuration.callSimulator.interval);
        configuration.callSimulator.interval = configuration.callSimulator.interval || 10;

        //setup station list
        sipEngine.registerPhones(configuration.stations);

        outboundCallInterval = setInterval(function(){
            outboundCallSim(configuration);
        }, configuration.callSimulator.interval * 1000);

        outboundCallSim(configuration);
    }

    return {
      status: function() {
          return status;
      },
      start: function(configuration){
          return startSimulation(configuration);
      },
      stop: function(){
          if(outboundCallInterval){
              clearInterval(outboundCallInterval);
          }
      }
    };
};
