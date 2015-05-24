# WebSpawn

## Installation

```bash
$ npm install web-spawn
```

## Features

  * Pipes stdin/stdout/stderr over web socket to allow communication with server process from client.
  * Transmits whitelisted signals to process from client.
    
## Dependencies

  * [EventEmitter v4.2.1](http://git.io/ee)
  * [Socket.IO v1.3.5](http://socket.io)
    
## Quick Start

### Server

```node
var app = require('express').createServer();
var io = require('socket.io')(app);
var webSpawn = require('web-spawn')(io, app);
var SocketSpawn = require('web-spawn').SocketSpawn;

// Can also be attached alternatively, like socket.io
// var webSpawn = require('web-spawn')(io);
// ...
// webSpawn.attach(app);

var cmds = {
    python2: function (socket) {
        var child = SocketSpawn(socket, ['python2', ['-u', '-i']);
    },
    python3: function (socket) {
        var child = SocketSpawn(socket, ['python3', ['-u', '-i']);
    }
};

webSpawn.route('/route', cmds, function(cmd, socket, query) {
    // cmd: fn to be called
    // socket: socket.io instance
    // query: query object sent by WebSpawn client
    
    // ...
    
    cmd(socket);
});

// ...


```

### Client

```javascript
<script src="/socket.io/socket.io.js"></script>
<script src="/js/EventEmitter.js"></script>
<script src="/web-spawn/web-spawn.js"></script>
<script>
    var cmd = 'python3';
    
    var ws = new WebSpawn({
        ns: '/route',
        query: {
            cmd: cmd
        }
    });
    
    ws.connect();
    
    // same as ws.stdout(fn);
    ws.on('stdout', function(data) {
        console.log("Received output from process: " + data);    
    });
    ws.on('stderr', function(data) {
        console.error("Received error from process: " + data);    
    });
    
    // same as ws.stdin(str);
    ws.emit('stdin', 'a = 5\n');
    ws.emit('stdin', 'a + 10\n');
    
</script>
```