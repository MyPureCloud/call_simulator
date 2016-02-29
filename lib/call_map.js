var callMap = {};

module.exports = {
    addCall: function(id, callback){
        console.log("adding call")
        callMap[id] = callback;

        console.log(callMap);
    },
    hasCall:function(id){
        return callMap[id] != null;
    },
    getCallback:function(id){
        return callMap[id];
    },
    removeCall: function(id){
        if(callMap[id]){
            delete callMap[id];
        }
    },
    callCount : function (){
        return Object.keys(callMap).length;
    },
    printIds: function(){
        console.log(Object.keys(callMap));
    }
}
