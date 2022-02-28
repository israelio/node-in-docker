const os = require('os');
const http = require('http');
const cluster = require('cluster');
const nodeprocess = require('process');

const numCPUs = os.cpus().length
const clusterEnabled = process.env['CLUSTERING_ENABLED'] || false
// console.log(process.env['CLUSTERING_ENABLED']);
if (clusterEnabled === 'true') {
    console.log('clustering enabled');
    // if (cluster.isMaster) {
    //     console.log(`Master ${process.pid} is running`);
    //     console.log(`There are ${numCPUs} cores`)
    //
    //     // Fork workers.
    //     for (let i = 0; i < numCPUs; i++) {
    //         cluster.fork();
    //     }
    //
    //     cluster.on('exit', (worker, code, signal) => {
    //         console.log(`worker ${worker.process.pid} died`);
    //     });
    // }
    // else {
    //     http.createServer((req, res) => {
    //         res.writeHead(200);
    //         res.end('hello world\n');
    //     }).listen(8000);
    //     console.log(`Worker ${process.pid} started`);
    // }
    if (cluster.isMaster) {
        console.log(`Master ${process.pid} is running`);
        console.log(`There are ${numCPUs} cores`)

        const reqTracker = {}

        // Fork workers and init request object
        for (let i = 0; i < numCPUs; i++) {
            const worker = cluster.fork();
            const id = worker.id
            reqTracker[id] = 0
        }

        console.log(`Requests tracker initialized ${JSON.stringify(reqTracker)}`)

        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });

        // Log the request object every 5 seconds
        setInterval(() => {
          console.log(`reqTracker = ${JSON.stringify(reqTracker)}`);
        }, 5000);

        // Loop thru the workers and catch messages
        for (const id in cluster.workers) {
            cluster.workers[id].on('message', (msg) => {
                if (msg.cmd && msg.cmd === 'notifyRequest') {
                    reqTracker[id] += 1
                }
            });
        }
    }
    else {
        http.createServer((req, res) => {
            res.writeHead(200);
            res.end('hello world\n');
            // As a worker, send message to master
            process.send({ cmd: 'notifyRequest' });
        }).listen(8000);
        console.log(`Worker ${process.pid} started`);
    }
}
else {
    const reqTracker = {}
    reqTracker[1] = 0

    setInterval(() => {
      console.log(`reqTracker = ${JSON.stringify(reqTracker)}`);
    }, 5000);

    console.log('running server locally on port 8000');
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end('hello world\n');
        reqTracker[1] += 1;
    }).listen(8000);
    console.log(`Main process ${process.pid} started`);
}
