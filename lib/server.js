var fs = require('fs'),
    path = require('path'),
    http = require('http');

var clientSource = fs.readFileSync(require.resolve('./web-spawn.js'), 'utf-8');
var clientSourceMin = fs.readFileSync(require.resolve('../dist/web-spawn.min.js'), 'utf-8');
var clientVersion = require('../package').version;

var Server = function (io, srv, opts) {
    if (!(this instanceof Server)) return new Server(io, srv, opts);

    if ('object' == typeof srv && !srv.listen) {
        opts = srv;
        srv = null;
    }

    opts = opts || {};
    this.io = io;
    this.nsps = {};
    this.path = opts.path || '/web-spawn';
    this.clientSource = opts.clientMin === false ? clientSource : clientSourceMin;

    if (srv) this.attach(srv, opts);
};

Server.prototype.attach = Server.prototype.listen = function (srv, opts) {
    this.attachServe(srv);
};

Server.prototype.attachServe = function (srv) {
    var url = this.path + '/web-spawn.js';

    var evs = srv.listeners('request').slice(0);
    var self = this;
    srv.removeAllListeners('request');
    srv.on('request', function (req, res) {
        if (0 === req.url.indexOf(url)) {
            self.clientServe(req, res);
        } else {
            for (var i = 0; i < evs.length; i++) {
                evs[i].call(srv, req, res);
            }
        }
    });
};

Server.prototype.clientServe = function (req, res) {
    var etag = req.headers['if-none-match'];
    if (etag) {
        if (clientVersion == etag) {
            res.writeHead(304);
            res.end();
            return;
        }
    }

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('ETag', clientVersion);
    res.writeHead(200);
    res.end(this.clientSource);
};

Server.prototype.route = function(ns, cmds, cb) {
    var self = this;
    
    this.io.of(ns).on('connection', function(socket) {
        try {
            var query = JSON.parse(socket.handshake.query.socketCmd);
        } catch (e) {
            return console.error("Could not parse JSON from WebSpawn request.");
        }
        var cmd = cmds[query.cmd];
        
        if (!cmd) {
            return socket.disconnect('No such command: ' + query.cmd);
        }
        
        cb.call(self, cmd, socket, query);
    });
};

module.exports = Server;