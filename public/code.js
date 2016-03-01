function getStatus(){
    $.getJSON('/status', function (status) {
        $("#callsPlaced").html(status.simulation.callsPlaced);
        $("#callsInProgress").html(status.simulation.callsInProgress);
        $("#registeredPhones").html(status.stations.registeredPhoneList.length);
        $(".simulatorIp").html(status.simIp);
        $("#ipaddresses").val(status.simIp);

        if(status.isRunning){
            $("#startSimulation").hide();
            $("#stopSimulation").show();
        }else{
            $("#startSimulation").show();
            $("#stopSimulation").hide();
        }
    });
}

function getConfiguration(){
    $.getJSON('/configuration', function (config) {
        $("#configuredPhones").html(config.stations.length);
        $("#edgeName").html(config.edgeServer.ip);
    });

    $.getJSON('/allips', function (config) {
        var optionsAsString = "";
        for(var i = 0; i < config.length; i++) {
            optionsAsString += "<option value='" + config[i] + "'>" + config[i] + "</option>";
        }
        $("#ipaddresses").append($(optionsAsString));

        getStatus();
    });
}
$(function() {
    getStatus();
    getConfiguration();

    $("#dial").click(function(){
        $.get("/dial/" + $("#dialNumber").val());
        event.preventDefault();
        return false;
    });

    $( "#ipaddresses" ).change(function() {
        $.ajax({
          url:"/setip/" + $(this).val(),
          type:"POST",
          data:JSON.stringify({}),
          contentType:"application/json",
          dataType:"json"
      });
    });

    $("#startSimulation").click(function(){
        $.get("/startsimulation").success(getStatus);;
        event.preventDefault();
        return false;
    });

    $("#stopSimulation").click(function(){
        $.get("/stopSimulation").success(getStatus);
        event.preventDefault();
        return false;
    });

    setInterval(getStatus, 3000);
});
