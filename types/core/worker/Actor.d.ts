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
declare class Actor {
    workerKey: string;
    currentActor: number;
    actorId: number;
    callbacks: any;
    callbackID: number;
    workerPool: any;
    workers: Array<any>;
    receiveFn: any;
    constructor(workerKey: string);
    /**
     * If the actor is active
     * @returns {Boolean}
     */
    isActive(): boolean;
    /**
     * Broadcast a message to all Workers.
     * @param {Object} data - data to send to worker thread
     * @param {ArrayBuffer[]} buffers - arraybuffers in data as transferables
     * @param {Function} cb - callback function when received message from worker thread
     */
    broadcast(data: any, buffers: any, cb: any): this;
    /**
     * Sends a message from a main-thread to a Worker and call callback when response received.
     *
     * @param {Object} data - data to send to worker thread
     * @param {ArrayBuffer[]} buffers - arraybuffers in data as transferables
     * @param {Function} cb - callback function when received message from worker thread
     * @param {Number} [workerId=undefined] - Optional, a particular worker id to which to send this message.
     */
    send(data: any, buffers: any, cb: any, workerId?: any): this;
    /**
     * A listener callback for incoming message from worker thread.
     * SHOULD NOT BE OVERRIDED only if you know what you are doing.
     * @param {Object} message - response message from worker thread
     */
    receive(message: any): void;
    /**
     * Remove the actor
     */
    remove(): void;
    /**
     * Send a message to a Worker.
     * @param {Object} data - data to send
     * @param {ArrayBuffer[]} buffers   - arraybuffers in data
     * @param {Number} targetID The ID of the Worker to which to send this message. Omit to allow the dispatcher to choose.
     * @returns {Number} The ID of the worker to which the message was sent.
     */
    post(data: any, buffers: any, targetID: any): any;
    /**
     * Get a dedicated worker in a round-robin fashion
     */
    getDedicatedWorker(): number;
}
export default Actor;
