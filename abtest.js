var Getopt = require('node-getopt'),
    child_process = require('child_process');


getopt = new Getopt([
    ['c' , ''                    , 'ab -c [process_num]. ep: -c 100'],
    ['n'  , ''                , 'ab -n [request_num]. ep: -n 10000'],
    ['s' , ''  , 'ab -s [server_url]. ep: -s http://127.0.0.1/'],
    ['h' , 'help'                , 'display this help']
]);
getopt.bindHelp().parseSystem();
global.childs = {};
global.start_time = 0;
global.end_time = 0;
global.use_time = 0;
global.lost_num=0;
global.k=0;
opt = getopt.parse(process.argv.slice(2));
if(opt.options.c && opt.options.n && opt.options.s){
    //每个进程发起请求数
    var process_req_num = parseInt(opt.argv[1]/opt.argv[0]);
    var request_num = parseInt(opt.argv[1]);
    var process_num   = parseInt(opt.argv[0]);
    var server_url  = opt.argv[2];

    //开启多少个进程
    for(var i=0; i< process_num; i++ ){
        childs[i] = child_process.fork('./benchmark.js');
        childs[i].send({ server_url: server_url,process_req_num:process_req_num});
        childs[i].on('message', function(data) {
            //console.log('PARENT got message:', data);
            var ms = (data.end_time[1])/1000/1000;
            var sec = (data.end_time[0]*1000);
            use_time +=(sec+ms);
            lost_num+=data.lost;
           // console.log("child use time:"+(sec+ms),data);
            console.log("%s 子进程请求累计完成 丢失:%s",data.child_pid,data.lost,data);
        });

    }
    //for(var i =0 ;i<process_num ;i++){
    //    childs[i].kill('SIGKILL');
    //}
    process.on('exit', function(code) {
        if(code === 0){
            console.log("concurrency:    "+process_num);
            console.log("request num:    "+request_num);
            console.log("lost    num:    "+lost_num);
            console.log("success num:    "+parseInt(request_num-lost_num));
            console.log("total_use time(ms):    "+(use_time/1000).toFixed(2)+'[ms]');
            console.log("req   per   second:    "+parseFloat(request_num/use_time*1000).toFixed(2)+'[/sec]');
            console.log("one   req  use(ms):    "+(use_time/request_num).toFixed(2)+"[ms]");
        }
    });
} else {
    getopt.showHelp();
    process.exit(0);
}

