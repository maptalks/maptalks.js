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
export declare function registerWorkerAdapter(workerKey: string, adapter: string | Function): void;
export declare function getWorkerSourcePath(): any;
