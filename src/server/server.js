//setup Dependencies
var http = require('http')
var connect = require('connect')
var express = require('express')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

var port = (process.env.PORT || 8081)

//Setup Express
app.set('views', __dirname + '/../views')
app.set('view options', { layout: false })
app.use(express.logger())
app.use(express.compress())
app.use(express.bodyParser())
app.use(express.cookieParser())
app.use(express.session({ secret: "m7g3MClazRYLCPnqqTU00QIbJEDH"}))
app.use(connect.static(__dirname + '/../static'))
app.use(app.router)
//app.use('/', express.static(__dirname + '/../static'))
app.use(express.errorHandler())

//Setup Socket.IO
io.sockets.on('connection', function (socket) {
    console.log('Client Connected');
    socket.on('message', function (data) {
        socket.broadcast.emit('server_message', data);
        socket.emit('server_message', data);
    });
    socket.on('disconnect', function () {
        console.log('Client Disconnected.');
    });
});

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

//app.get('/', function (req, res) {
//    res.render('index.html', {
//        title: 'Your Page Title', description: 'Your Page Description', author: 'Your Name', analyticssiteid: 'XXXXXXX'
//    });
//});

require('./services').setupRoutes(app)

function NotFound(msg) {
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

server.listen(port);
console.log('Listening on http://0.0.0.0:' + port);
