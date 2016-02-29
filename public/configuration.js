var simConfig = {};
$(function() {
    $.getJSON('/configuration', function (config) {
        simConfig = config;
        $("#stationList").val(config.stations.join(","));
        $("#edgeServerIp").val(config.edgeServer.ip);

        if(config.callSimulator){
            $("#concurrentCalls").val(config.callSimulator.concurrentCalls);
            $("#interval").val(config.callSimulator.interval);

            if(config.callSimulator.calls && config.callSimulator.calls.length>0){
                $("#to").val(config.callSimulator.calls[0].to);
                $("#fromNumber").val(config.callSimulator.calls[0].fromNumber);
                $("#fromName").val(config.callSimulator.calls[0].fromName);
            }
        }

    });

    $("button").click(function(){
        var config = simConfig;
        config.edgeServer.ip = $("#edgeServerIp").val();
        config.stations = $("#stationList").val().split(',')

        config.callSimulator = {
            concurrentCalls : $("#concurrentCalls").val(),
            interval : $("#interval").val(),
            calls : [
                {
                    to : $("#to").val(),
                    fromNumber : $("#fromNumber").val(),
                    fromName : $("#fromName").val()
                }
            ]
        };

        $.ajax({
          url:"/configuration",
          type:"POST",
          data:JSON.stringify(config),
          contentType:"application/json",
          dataType:"json"
      });
    });

});
