/**
 * Worker Pool
 * contains code from [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js)
 * @private
 */
export default class WorkerPool {
    active: object;
    workerCount: number;
    _messages: Array<any>;
    _messageBuffers: Array<any>;
    workers: Array<Worker>;
    constructor();
    acquire(id: any): Worker[];
    release(id: any): void;
    addMessage(workerId: any, data: any, buffers: any): void;
    commit(): void;
}
export declare function getGlobalWorkerPool(): any;
