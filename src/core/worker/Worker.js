import { isFunction } from '../util/common.js';
import { getWorkerPool, pushAdapterCreated } from './CoreWorkers.js';

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
    // Dynamic Create Adapter
    function createAdapter(key,code){
        if(adapters[key]||!code){
            return;
        }
        var func=new Function('exports',code+'(exports)');
        var workerExports={};
        func(workerExports,self);
        adapters[key]=workerExports;
        workerExports.initialize && workerExports.initialize(self);
        
    }
    onmessage = function (msg) {
        msg = msg.data;
        //createAdapter
        if (msg.messageType === 'createAdapter') {
           var key=msg.key;
           var code=msg.code;
           createAdapter(key,code);
           postMessage({adapterName:key});
           return;
        }
        if (msg.messageType === 'batch') {
            const messages = msg.messages;
            if (messages) {
                for (let i = 0; i < messages.length; i++) {
                    dispatch(messages[i]);
                }
            }
        } else {
            dispatch(msg);
        }
    };

    function dispatch(msg) {
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
            console.error(err);
            throw err;
        }
    }

    function post(callback, err, data, buffers) {
        var msg = {
            callback : callback
        };
        if (err) {
            msg.error = err;
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
        let adapter = adapters[p];
        pushAdapterCreated(p);
        if (isFunction(adapter)) {
            if (adapter.length === 0) {
                // new definition form of worker source
                adapter = adapter();
            }
        }
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
    if (typeof window === 'undefined') {
        return null;
    }
    if (!url) {
        const source = compileWorkerSource();
        url = window.URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        //clear cached worker adapters
        adapters = {};
    }
    return url;
}

// Dynamic Create Adapter
//利用worker通信向每个workerPool里的每个worker注入新的code
//注意注入的代码在worker code里不是明文的，是个匿名函数挂到adapters,代码层面是看不到改段代码的
export function createAdapter(key, cb) {
    if (!adapters[key]) {
        console.error(`not find ${key} adapter`);
        return;
    }
    let adapter = adapters[key];
    if (isFunction(adapter)) {
        if (adapter.length === 0) {
            // new definition form of worker source
            adapter = adapter();
        }
    }
    adapter = `(${adapter})`;
    const workerPool = getWorkerPool();
    if (!workerPool) {
        return;
    }
    const workers = workerPool.workers || [];
    if (workers.length === 0) {
        console.error('workerpool workers count is 0');
    }
    let count = 0;
    const messageCB = (msg) => {
        msg = msg.data || {};
        if (msg.adapterName === key) {
            count++;
            if (count === workers.length) {
                workers.forEach(worker => {
                    worker.removeEventListener('message', messageCB);
                });
                delete adapters[key];
                cb();
            }
        }
    };
    workers.forEach(worker => {
        worker.addEventListener('message', messageCB);
        worker.postMessage({ key, code: adapter, messageType: 'createAdapter' });
    });


}
