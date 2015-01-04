var http = require('http'),
    fs = require('fs');
//var short_http = function (server_url){
//
//    http.get(server_url, function (response) {
//
//        var body = [];
//        console.log(response.statusCode);
//        console.log(response.headers);
//
//        response.on('data', function (chunk) {
//            body.push(chunk);
//        });
//
//        response.on('end', function () {
//            body = Buffer.concat(body);
//            console.log(body.toString());
//        });
//    });
//};
process.on('message', function(m) {
    //.log('CHILD got message:', m);
    var time = new Date().getTime();
    fs.writeFile('./log/start_time.log',time , function (err) {
        if (err) throw err;
    });
    var lost = 0;
    for(var i=0;i< m.process_req_num;i++){
        http.get(m.server_url, function (response) {

            if(response.statusCode != 200){
                lost++;
            }
            var body = [];
            //console.log(response.statusCode);
            //console.log(response.headers);
            response.on('data', function (chunk) {
                body.push(chunk);
            });

            response.on('end', function () {
                body = body.join('');
               console.log(body.toString());
            });
        });
    };
    fs.writeFile('./log/lost_'+process.pid+'.log', lost, function (err) {
        if (err) throw err;
    });
    process.send({child_pid:process.pid});
    process.exit(0);
});
process.on('exit', function (){

});



//exports.short_http = short_http;