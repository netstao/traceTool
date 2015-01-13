var http = require('http');

var lost = 0;
var end = 0;
var start = 0;
global.codes = [];
process.on('message', function(m) {
    start = process.hrtime();


    for(var i=0;i< m.process_req_num;i++){
        var client = http.get(m.server_url,function(){

        });
        client.on('response', function (data) {
            if(data.statusCode!=200) lost++;
            send_p(data.statusCode);
            client.end();
        });
        client.on('close', function (data) {
            console.log('connection end');
           // process.send({child_pid:process.pid,start_time:start,end_time:end,lost:lost});
        });
    };
    //console.log(lost+1,codes);
    end = process.hrtime(start);

    function send_p(data){
        process.send({child_pid:process.pid,start_time:start,end_time:end,lost:lost,code:data});
    }


    //
});


