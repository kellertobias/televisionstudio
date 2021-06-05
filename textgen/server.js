const SocketServer = require('ws').Server;
const diskspace = require('diskspace');
const os = require('os-utils')
const loadFonts = require('./fonts')
var express = require('express');

var connectedUsers = [];

fontsCss = loadFonts()
//init Express
var app = express();

//init Express Router
var router = express.Router();
var port = process.env.PORT || 3020;

var lastMessage = {
    textgen: ["Empty"],
    credits: [
        {type: 'scroll',
         content: [
            {title: 'Abspann',
                content: [
                'Bisher wurde noch',
                'kein Text für den Abspann',
                'übertragen'
            ]},
            {title: 'Wie?',
                content: [
                'Der Abspann sollte',
                'Eine Liste von Objekten sein.',
                'Jedes Objekt hat einen "type" und "content"'
            ]},
            {title: 'Type',
                content: [
                'Der Type ist "scroll" oder "fade"',
                'bei scroll gibt es noch speed, bei',
                'fade gibt es time und fade'
            ]},
            {title: 'Content',
                content: [
                'Der Content ist eine Liste',
                'von objekten mit "title" und "content"',
                'welches widerum eine liste von String ist'
            ]},
        ]},
        {type: 'fade',
         time: 10,
         content: [
            {title: '&copy; 2021',
                content: [
                'Tobisk Media'
            ]}
        ]},
    ]
}

sendMessage = function(message) {
    var msg = JSON.stringify(message);
    console.log("Sending", msg);
    connectedUsers.forEach(user => {
        user.send(msg);
    })
}

app.use(express.json());

//default/test route
router.get('/text', function(req, res) {
    res.json({ status: "Success", msg: {lines: ["Empty"]}});
    sendMessage({scope: 'test'})
});

router.get('/fonts.css', function(req, res) {
    res.setHeader("content-type", 'text/css');
    res.send(fontsCss);
});

router.get('/status', function(req, res) {
    diskspace.check(process.env.CHECKDISK || '/', (err, result) => {
        console.log("DISK", result)
        res.json({
            ram: os.freememPercentage(),
            cpu: os.loadavg(1) / os.cpuCount(),
            disk: {
                total: result.total,
                used: result.used
            }
        });
    })

    
});

router.post('/text', function(req, res) {
    try {
        let message = req.body
        res.json({ status: "Success", msg: ['Empty']});
        if(!message.content && !message.scope && !message.lines) {
            // If there is nothing of the fields set we expect,
            // we assume that the whole message is the content
            const content = message
            message = {
                scope: 'textgen',
                content
            }
        }
        if(!message.scope) message.scope = 'textgen'
        if(!message.content && message.lines) {
            message.content = message.lines
            delete message.lines
        }
        lastMessage[message.scope] = message.content
        sendMessage(message)    
    } catch (error) {
        console.error("Error in API Handler", error)
    }
    
});

//connect path to router
app.use("/", router);
app.use(express.static('client'))
var server = app.listen(port, function () {
    console.log('node.js static, REST server and websockets listening on port: ' + port)
})

//if serving static app from another server/port, send CORS headers in response
//{ headers: {
//"Access-Control-Allow-Origin": "*",
//    "Access-Control-Allow-Headers": "http://localhost:3000",
//    "Access-Control-Allow-Methods": "PUT, GET, POST, DELETE, OPTIONS"
//} }
const wss = new SocketServer({ server });

//init Websocket ws and handle incoming connect requests
wss.on('connection', function connection(ws) {
    try {
        console.log("connection ...");
        connectedUsers.push(ws);

        //on connect message
        ws.on('message', function incoming(message) {
            ws.send("PONG")
        });
        Object.keys(lastMessage).forEach((scope) => {
            ws.send(JSON.stringify({scope, content: lastMessage[scope]}));
        })   
    } catch (error) {
        console.error("Error in WebSocket Connection", error)
    }
});