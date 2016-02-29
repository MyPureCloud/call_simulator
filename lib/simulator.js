module.exports = function(sipEngine, ipAddress){

    var status = {
        simulation:{
            callsPlaced: 0,
            callsReceived: 0,
        },
        stations:{
            registeredPhoneList:[]
        },
        isRunning: false
    };

    var simulationCallsPlaced = 0;
    var outboundCallInterval = null;
    var outboundCallIndex = 0;

    function outboundCallSim(configuration){
        console.log("checking outbound calls current: " + sipEngine.getCurrentOutboundCallCount() + " max: "+ configuration.callSimulator.concurrentCalls);

        if(sipEngine.getCurrentOutboundCallCount() < configuration.callSimulator.concurrentCalls){

            simulationCallsPlaced = simulationCallsPlaced + 1;

            var outboundCall = configuration.callSimulator.calls[outboundCallIndex];
            outboundCallIndex = outboundCallIndex + 1;
            outboundCallIndex = outboundCallIndex % configuration.callSimulator.calls.length;

            console.log("placing call to " + outboundCall.to);

            sipEngine.makeCall("sip:" + outboundCall.to + "@" + configuration.edgeServer.ip + ":5060"  ,
                                outboundCall.fromName,
                                "sip:" + outboundCall.fromNumber +"@" +ipAddress + ":5060");
        }
    }

    function startSimulation(configuration){
        console.log("Starting sim, interval " + configuration.callSimulator.interval);
        simulationCallsPlaced = 0;
        configuration.callSimulator.interval = configuration.callSimulator.interval || 10;

        //setup station list
        sipEngine.registerPhones(configuration.stations, configuration.edgeServer.ip);

        outboundCallInterval = setInterval(function(){
            outboundCallSim(configuration);
        }, configuration.callSimulator.interval * 1000);

        //outboundCallSim(configuration);

        status.isRunning = true;
    }

    function stopSimulation(){
        try{
            console.log("stopping simulation");
            status.isRunning = false;

            if(outboundCallInterval){
                clearInterval(outboundCallInterval);
            }
        }
        catch(ex){
            console.log("Error stopping simulation");
            console.log(ex);
        }

    }

    return {
      status: function() {
          status.simulation.callsPlaced = simulationCallsPlaced;
          status.simulation.callsInProgress = sipEngine.getCurrentOutboundCallCount();
          return status;
      },
      start: function(configuration){
          return startSimulation(configuration);
      },
      stop: function(){
          stopSimulation();
      }
    };
};
