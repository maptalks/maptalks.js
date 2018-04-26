let adapters = {};
/**
 * Register a worker adapter
 * @param {String} workerKey  - an unique key name of the worker adapter
 * @param {Function} adapter  - the worker adapter function, it must be a complete packaged function with no dependency of other functions
 * @example
 * maptalks.registerWorkerAdapter('foo', function (exports, global) {
        //will be called only for once when loaded in worker thread
        exports.initialize = function () {
          console.log('[worker] initialized');
        };
        //to receive message from main thread sent by maptalks.worker.Actor
        exports.onmessage = function (message, postResponse) {
          const data = message.data;
          console.log(`[worker] received data : ` + data);
          //send message back to main thread
          //the parameters:
          //error, data, buffers (arraybuffers in data)
          postResponse(null, 'message from worker thread', null);
        };
     });
    @global
    @static
 */
export function registerWorkerAdapter(workerKey, adapter) {
    adapters[workerKey] = adapter;
}

const header = `
    var adapters = {};
    onmessage = function (msg) {
        msg = msg.data;
        var workerKey = msg.workerKey;
        var adapter = adapters[workerKey];
        if (!adapter) {
            post(msg.callback, 'Unregistered worker adapters for ' + workerKey);
            return;
        }
        try {
            adapter.onmessage(msg, wrap(msg.callback));
        } catch (err) {
            post(msg.callback, workerKey + ':' + err.message);
            throw err;
        }
    };
    function post(callback, err, data, buffers) {
        var msg = {
            callback : callback
        };
        if (err) {
            msg.error = err.message ? err.message : err.toString();
        } else {
            msg.data = data;
        }
        if (buffers && buffers.length > 0) {
            postMessage(msg, buffers);
        } else {
            postMessage(msg);
        }
    }
    function wrap(callback) {
        return function (err, data, buffers) {
            post(callback, err, data, buffers);
        };
    }
    var workerExports;
`;

const footer = `
    workerExports = null;
`;

function compileWorkerSource() {
    let source = header;
    for (const p in adapters) {
        const adapter = adapters[p];
        source += `
    workerExports = {};
    (${adapter})(workerExports, self);
    adapters['${p}'] = workerExports`;
        source += `
    workerExports.initialize && workerExports.initialize(self);
        `;

    }
    source += footer;
    return source;
}

let url;

export function getWorkerSourcePath() {
    if (!url) {
        const source = compileWorkerSource();
        url = window.URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        //clear cached worker adapters
        adapters = null;
    }
    return url;
}
