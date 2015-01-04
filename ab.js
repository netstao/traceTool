var Getopt = require('node-getopt'),
    benchm = require("./benchmark.js"),
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
global.total_time = 0;
global.lost_num=0;
global.k=0;
opt = getopt.parse(process.argv.slice(2));
if(opt.options.c && opt.options.n && opt.options.s){
    var process_req_num = parseInt(opt.argv[1]/opt.argv[0]);
    var request_num = parseInt(opt.argv[1]);
    var process_num   = parseInt(opt.argv[0]);
    var server_url  = opt.argv[2];
    start_time = new Date().getTime();
    for(var i=0; i< process_num; i++ ){
        childs[i] = child_process.fork('./benchmark.js');
        childs[i].send({ server_url: server_url,process_req_num:process_req_num});
        childs[i].on('message', function(data) {
            console.log('PARENT got message:', data);
            console.log("%s 请求累计完成", k+=process_req_num);
        });
        childs[i].on('exit', function (code) {
            if (code !== 0) {
                console.log(code);
            }else{

            }
        });
    }
    end_time = new Date().getTime();
    total_time = end_time-start_time;
} else {
    getopt.showHelp();
}
process.on('exit', function(code) {
    if(code === 0){
        console.log("concurrency:\t"+process_num);
        console.log("request num:\t"+request_num);
        console.log("lost    num:\t"+lost_num);
        console.log("success num:\t"+parseInt(request_num-lost_num));
        console.log("total  time:\t"+total_time);
        console.log("req per second:\t"+parseFloat(request_num/total_time*1000));
        console.log("one req use(ms):\t"+total_time/request_num+"ms");
    }
});

