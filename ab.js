var cluster = require('cluster');
var http = require('http');
var Getopt = require('node-getopt');
var fs = require('fs');
getopt = new Getopt([
    ['s' , '' , ' -s [server]. ep: -s 127.0.0.1/click  default  click'],
    ['t'  , '' , ' -t [time]. ep: -t 1 default 1 hour'],
    ['p'  , '' , ' -p [port]. ep: -p 8007 default 80']
]);
getopt.bindHelp().parseSystem();
opt = getopt.parse(process.argv.slice(2));
global.workers = {};
if(opt.options.s && opt.options.t){

    var server = opt.argv[0];  //server
    var time = parseFloat(opt.argv[1]);  //持续时间 默认一小时
    var port = parseInt(opt.argv[2]);  //端口

    var action = server.split('/')[1];
    typeof action == 'undefined' || action =='' ? action = 'click':action;
    var start_time  = new Date().getTime()/1000;
    if (cluster.isMaster) {
        console.log('[master] ' + "start master...");
        for (var i = 0; i < 4 ; i++) {
            var work = cluster.fork();
            workers[i] = work;
            //work.send({server:server,time:time,port:port,start_time:star_time});
        }

        /*事件中断*/
        process.on('SIGINT', function() {
            console.log('收到 SIGINT 信号。');
            process.exit(0);
        });

        cluster.on('exit', function(worker, code, signal) {
            /*console.log("concurrency:    "+process_num);
            console.log("request num:    "+request_num);
            console.log("lost    num:    "+lost_num);
            console.log("success num:    "+parseInt(request_num-lost_num));
            console.log("total_use time(ms):    "+(use_time/1000).toFixed(2)+'[ms]');
            console.log("req   per   second:    "+parseFloat(request_num/use_time*1000).toFixed(2)+'[/sec]');
            console.log("one   req  use(ms):    "+(use_time/request_num).toFixed(2)+"[ms]");*/
        });

        //文件读取
        var container = [];
        function readLines(input, func) {
            var remaining = '';
            input.on('data', function(data) {
                remaining += data;
                var index = remaining.indexOf('\n');
                while (index > -1) {
                    var line = remaining.substring(20, index);
                    remaining = remaining.substring(index + 1);

                    index = remaining.indexOf('\n');
                }
                function send_child(line){
                    var random_num = parseInt(Math.random()*4);
                    //随机发送给子进程处理
                    workers[random_num].send({url:encodeURI('/'+action+'?'+line+'&random='+random_num

                    )});
                }
                setTimeout(send_child,1,line);

            });

            input.on('end', function() {
                if (remaining.length > 0) {
                    func(remaining);
                }
            });
        }

        function func(data) {
            container.push(data);
        }
        var logs = fs.createReadStream('./log/'+action+'.log',{flags:'r',encoding:'utf8'});
        readLines(logs, func);

    } else if (cluster.isWorker) {

        /**************************************************************************************************************/
        //子进程
        var options = {
            hostname: server? server.split('/')[0] : '127.0.0.1',
            port: port ? port : 80,
            path: '/',
            method: 'GET',
            headers: {
                'accept': '*/*',
                'content-type': "application/atom+xml",
                'accept-encoding': 'gzip, deflate',
                'accept-language': 'en-US,en;q=0.9',
                'user-agent': 'node benchmark test',
                'Agent': false
            }
        };

        /*接受父进程消息*/
        process.on('message',function(data){
            options.path=data.url+'&pid='+process.pid;
            setTimeout(startClient, 100,options);
        });

        var getHttpGlobalAgentQueueLength = function () {
            var num = 0;
            Object.keys(http.globalAgent.requests).forEach(function (name) {
                num += http.globalAgent.requests[name].length;
            });
            console.log('进程pid:'+process.pid,'请求队列:'+num);
        };
        setInterval(getHttpGlobalAgentQueueLength,3000);

        console.log('[worker] ' + process.pid + "start worker ..." + cluster.worker.id);

        //发起请求
        function startClient(options) {
            // send off a bunch of concurrent requests
            // TODO make configurable
            sendRequest();
            function sendRequest() {
                //console.log(options);
                var end_time = new Date().getTime()/1000;
                //console.log(parseInt(end_time-start_time)>time*3600);
                if(parseInt(end_time-start_time)>=time*3600){
                    console.log(process.pid + ' exit');
                    process.exit(0);
                }
                var req = http.request(options, onConnection);
                req.setSocketKeepAlive(true,3000);
                req.on('error', onError);
                req.end();
            }
            // add a little back-off to prevent EADDRNOTAVAIL errors, it's pretty easy
            // to exhaust the available port range
            function relaxedSendRequest() {
               setTimeout(sendRequest, 1);
            }

            function onConnection(res) {
                res.on('error', onError);
                res.on('data', onData);
                res.on('end', relaxedSendRequest);
            }

            function onError(err) {
                console.error(err.stack);
                relaxedSendRequest();
            }

            function onData(data) {
                // this space intentionally left blank
            }
        }


        //ctrl+c事件中断
        process.on('SIGINT', function() {
            console.log('收到 SIGINT 信号。  ');
            process.exit(0);
        });
        process.on('uncaughtException', function(err) {
            console.log('Caught exception: ' + err.stack);
            process.exit(0);
        });
    }

} else {
    getopt.showHelp();
    process.exit(0);
}

