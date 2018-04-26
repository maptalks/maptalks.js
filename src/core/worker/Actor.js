import { getGlobalWorkerPool } from './WorkerPool';
import { UID } from '../util';

/**
 * An actor to exchange data from main-thread to workers
 * contains code from [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js)
 * @category core
 * @memberof worker
 * @example
 *  const workerKey = 'test_worker_key';
    maptalks.registerWorkerAdapter(workerKey, function (exports, global) {
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

    const MyActor = class extends maptalks.worker.Actor {
      test(info, cb) {
        //send data to worker thread
        this.send(info, null, cb);
      }
    }

    //must be same with workerKey for maptalks.registerWorkerAdapter
    const actor = new MyActor(workerKey);
    actor.test('hi', (err, data) => {
      //received data from worker thread
      console.log(data);
    });
 */
export default class Actor {

    constructor(workerKey) {
        this.workerKey = workerKey;
        this.workerPool = getGlobalWorkerPool();
        this.currentActor = 0;
        this.dedicatedActor = 0;
        this.poolId = UID();
        this.workers = this.workerPool.acquire(this.poolId);
        this.callbacks = {};
        this.callbackID = 0;
        this.receiveFn = this.receive.bind(this);
        this.workers.forEach(w => {
            w.addEventListener('message', this.receiveFn, false);
        });
    }

    /**
     * If the actor is active
     * @returns {Boolean}
     */
    isActive() {
        return !!this.workers;
    }

    /**
     * Broadcast a message to all Workers.
     * @param {Object} data - data to send to worker thread
     * @param {ArrayBuffer[]} buffers - arraybuffers in data as transferables
     * @param {Function} cb - callback function when received message from worker thread
     */
    broadcast(data, buffers, cb) {
        cb = cb || function () {};
        asyncAll(this.workers, (worker, done) => {
            this.send(data, buffers, done, worker.id);
        }, cb);
        return this;
    }

    /**
     * Sends a message from a main-thread to a Worker and call callback when response received.
     *
     * @param {Object} data - data to send to worker thread
     * @param {ArrayBuffer[]} buffers - arraybuffers in data as transferables
     * @param {Function} cb - callback function when received message from worker thread
     * @param {Number} [workerId=undefined] - Optional, a particular worker id to which to send this message.
     */
    send(data, buffers, cb, workerId) {
        const id = cb ? `${this.poolId}:${this.callbackID++}` : null;
        if (cb) this.callbacks[id] = cb;
        this.post({
            workerKey : this.workerKey,
            data : data,
            callback: String(id)
        }, buffers, workerId);
        return this;
    }

    /**
     * A listener callback for incoming message from worker thread.
     * SHOULD NOT BE OVERRIDED only if you know what you are doing.
     * @param {Object} message - response message from worker thread
     */
    receive(message) {
        const data = message.data,
            id = data.callback;
        const callback = this.callbacks[id];
        delete this.callbacks[id];
        if (callback && data.error) {
            callback(new Error(data.error));
        } else if (callback) {
            callback(null, data.data);
        }
    }

    /**
     * Remove the actor
     */
    remove() {
        this.workers.forEach(w => {
            w.removeEventListener('message', this.receiveFn, false);
        });
        this.workerPool.release(this.poolId);
        delete this.receiveFn;
        delete this.workers;
        delete this.callbacks;
        delete this.workerPool;
    }

    /**
     * Send a message to a Worker.
     * @param {Object} data - data to send
     * @param {ArrayBuffer[]} buffers   - arraybuffers in data
     * @param {Number} targetID The ID of the Worker to which to send this message. Omit to allow the dispatcher to choose.
     * @returns {Number} The ID of the worker to which the message was sent.
     */
    post(data, buffers, targetID) {
        if (typeof targetID !== 'number' || isNaN(targetID)) {
            // Use round robin to send requests to web workers.
            targetID = this.currentActor = (this.currentActor + 1) % this.workerPool.workerCount;
        }
        if (buffers) {
            this.workers[targetID].postMessage(data, buffers);
        } else {
            this.workers[targetID].postMessage(data);
        }

        return targetID;
    }

    /**
     * Get a dedicated worker in a round-robin fashion
     */
    getDedicatedWorker() {
        this.dedicatedWorker = (this.dedicatedWorker + 1) % this.workerPool.workerCount;
        return this.dedicatedWorker;
    }

}

function asyncAll(array, fn, callback) {
    if (!array.length) { callback(null, []); }
    let remaining = array.length;
    const results = new Array(array.length);
    let error = null;
    array.forEach((item, i) => {
        fn(item, (err, result) => {
            if (err) error = err;
            results[i] = result;
            if (--remaining === 0) callback(error, results);
        });
    });
}
