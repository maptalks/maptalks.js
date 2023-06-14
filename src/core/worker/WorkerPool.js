import { requestAnimFrame } from '../util';
import { getWorkerSourcePath } from './Worker';

const hardwareConcurrency = typeof window !== 'undefined' ? (window.navigator.hardwareConcurrency || 4) : 0;
const workerCount = Math.max(Math.floor(hardwareConcurrency / 2), 1);

class MessageBatch {
    constructor(limit = 50) {
        this._limit = limit;
        this._messages = [];
        this.buffers = [];
    }

    addMessage(msg, buffers) {
        this._messages.push(msg);
        if (!Array.isArray(buffers)) {
            return;
        }
        for (let i = 0; i < buffers.length; i++) {
            if (this.buffers.indexOf(buffers[i]) < 0) {
                this.buffers.push(buffers[i]);
            }
        }
    }

    isFull() {
        return this._messages.length >= this._limit;
    }

    getMessage() {
        return { messageType: 'batch', messages: this._messages };
    }
}


/**
 * Worker Pool
 * contains code from [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js)
 * @private
 */
export default class WorkerPool {
    constructor() {
        this.active = {};
        this.workerCount = typeof window !== 'undefined' ? (window.MAPTALKS_WORKER_COUNT || workerCount) : 0;
        this._messages = [];
        this._messageBuffers = [];
    }

    acquire(id) {
        if (!this.workers) {
            this.workers = [];
            const url = getWorkerSourcePath();
            for (let i = 0; i < this.workerCount; i++) {
                const worker = new Worker(url);
                worker.id = i;
                this.workers.push(worker);
            }
            URL.revokeObjectURL(url);
        }
        this.active[id] = true;

        return this.workers.slice();
    }

    release(id) {
        delete this.active[id];
        if (Object.keys(this.active).length === 0) {
            this.workers.forEach((w) => {
                w.terminate();
            });
            this.workers = null;
        }
    }

    addMessage(workerId, data, buffers) {
        let batches = this._messages[workerId];
        if (!batches || !batches.length) {
            batches = this._messages[workerId] = [new MessageBatch()];
        }
        let batch = batches[batches.length - 1];
        if (batch.isFull()) {
            batch = new MessageBatch();
            this._messages[workerId].push(batch);
        }
        batch.addMessage(data, buffers);
    }

    commit() {
        if (!this.workers) {
            return;
        }
        if (this._messages.length) {
            for (let i = 0; i < this._messages.length; i++) {
                if (!this._messages[i] || !this._messages[i].length) {
                    continue;
                }
                const batch = this._messages[i].shift();
                this.workers[i].postMessage(batch.getMessage(), batch.buffers);
            }
        }
    }
}

let globalWorkerPool;
export function getGlobalWorkerPool() {
    if (!globalWorkerPool) {
        globalWorkerPool = new WorkerPool();
    }
    return globalWorkerPool;
}

function frameLoop() {
    getGlobalWorkerPool().commit();
    requestAnimFrame(frameLoop);
}
if (requestAnimFrame) {
    requestAnimFrame(frameLoop);
}
