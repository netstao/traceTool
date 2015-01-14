var http = require('http');
http.globalAgent.maxSockets = 200000000;
http.createServer(function (request, response) {

    response.writeHead(200, { 'Content-Type': 'text/plain' });
    request.on('data', function (chunk) {
        console.log(chunk);
        response.write(chunk);
    });
    request.on('error',function(err){
        console.log(err);
    });
    var timer = null;
    request.on('end', function () {
        timer = setTimeout(function(){

        },300);
        console.log(new Date().getTime()+Math.random()*1000,request.url.toString());
        response.end('test');
        clearTimeout(timer);

    });
}).listen(80);
//var http = require('http');

// Create an HTTP server
//var srv = http.createServer(function (req, res) {
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    res.end('okay');
//});
//srv.on('upgrade', function(req, socket, head) {
//    socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
//    'Upgrade: WebSocket\r\n' +
//    'Connection: Upgrade\r\n' +
//    '\r\n');
//
//    socket.pipe(socket); // echo back
//});