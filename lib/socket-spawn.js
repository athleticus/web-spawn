var spawn = require('child_process').spawn;

var SocketSpawn = function (socket, spawnArgs, opts, cb) {
    if (!(this instanceof SocketSpawn)) return new SocketSpawn(socket, spawnArgs, opts, cb);
    
    if(typeof cb === 'undefined') {
        cb = opts;
        opts = null;
    }
    
    var self = this;
    
    var child = spawn.apply(spawn, spawnArgs);

    socket.on('disconnect', function () {
        child.kill();
    });

    socket.on('stdin', function (data) {
        child.stdin.write(data);
    });

    child.stdout.on('data', function (data) {
        socket.emit('stdout', data.toString());
    });

    child.stderr.on('data', function (data) {
        socket.emit('stderr', data.toString());
    });

    child.on('close', function (code) {
        socket.emit('exit', code);
        socket.disconnect();
    });
    
    socket.on('signal', function(signal) {
        if(self.allowedSignals.indexOf(signal) === -1) {
            // todo: handle invalid signal
            console.warn('Invalid signal ' + signal);
            return;
        }
        console.log('Received ' + signal);
        child.kill(signal);
    });
    
    this.child = child;

    cb && cb(child);
};

SocketSpawn.prototype.allowedSignals = ['SIGINT', 'SIGKILL'];

SocketSpawn.prototype.getProcess = function() {
    return this.child;
};

module.exports = SocketSpawn;