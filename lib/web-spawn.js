// Dependencies:
//  - socketio: socket.io 1.3.x
//  - EventEmitter: EventEmitter 4.2.11; git.io/ee

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['socketio', 'eventEmitter'], function (io, EventEmitter) {
            return (root.WebSpawn = factory(io, EventEmitter));
        });
    } else {
        // Browser globals
        root.WebSpawn = factory(root.io, root.EventEmitter);
    }
}(this, function (io, EventEmitter) {

    /**
     * Merge defaults with user options
     * @private
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     * @returns {Object} Merged values of defaults and options
     * 
     * http://gomakethings.com/vanilla-javascript-version-of-jquery-extend/
     */
    var extend = function (defaults, options) {
        var extended = {};
        var prop;
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    };

    var WebSpawn = function (opts) {
        if (!(this instanceof WebSpawn)) return new WebSpawn(opts);
        
        EventEmitter.call(this);

        this.opts = opts = extend(this.opts, opts || {});

        var address = opts.port ? ':' + opts.port : '';
        address += opts.ns ? opts.ns : '';

        this.address = address;
    };

    WebSpawn.prototype = Object.create(EventEmitter.prototype);

    WebSpawn.prototype.connect = function () {
        var self = this;
        console.log('connecting');

        var socket = self.socket = io(this.address, {
            query: 'socketCmd=' + encodeURIComponent(JSON.stringify(this.opts.query)),
            'force new connection': true
        });

        socket.on('stdout', function (data) {
            if (self.opts.log) {
                console.log('stdout: ' + JSON.stringify(data));
            }

            self.emit('stdout', data);
        });
        socket.on('stderr', function (data) {
            if (self.opts.log) {
                console.error('stderr: ' + JSON.stringify(data));
            }

            self.emit('stderr', data);
        });
        socket.on('disconnect', function (code) {
            self.emit('disconnect');
        });
        socket.on('exit', function (code) {
            if (self.opts.log) {
                console.warn('ended with code: ', code);
            }
            self.emit('exit', code);
        });
        socket.on('connect', function () {
            self.emit('connect');
        });
        self.on('stdin', function (data) {
            socket.emit('stdin', data);
        });
        self.on('signal', function (signal) {
            socket.emit('signal', signal);
        });

        return socket;
    };

    WebSpawn.create = function (opts) {
        return new WebSpawn(opts);
    };

    WebSpawn.setDefault = function (prop, value) {
        WebSpawn.prototype.opts[prop] = value;
    };

    WebSpawn.prototype.opts = {
        port: location.port,
        log: false,
        query: {}
    };

    WebSpawn.prototype.stdout = function (cb) {
        this.on('stdout', cb);
    };

    WebSpawn.prototype.stderr = function (cb) {
        this.on('stderr', cb);
    };

    WebSpawn.prototype.stdin = function (data) {
        this.emit('stdin', data);
    };

    WebSpawn.prototype.signal = function (data) {
        this.emit('signal', data);
    };

    WebSpawn.prototype.disconnect = function () {
        this.socket && this.socket.disconnect();
    };

    window.WebSpawn = WebSpawn;

    return WebSpawn;
}));