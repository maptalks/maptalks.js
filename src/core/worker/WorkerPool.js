import { getWorkerSourcePath } from './Worker';

const hardwareConcurrency = window.navigator.hardwareConcurrency || 4;
const workerCount = Math.max(Math.floor(hardwareConcurrency / 2), 1);

/**
 * Worker Pool
 * contains code from [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js)
 * @private
 */
export default class WorkerPool {
    constructor() {
        this.active = {};
        this.currentID = 0;
        this.workerCount = window.MAPTALKS_VT_WORKER_COUNT || workerCount;
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

}

let globalWorkerPool;

export function getGlobalWorkerPool() {
    if (!globalWorkerPool) {
        globalWorkerPool = new WorkerPool();
    }
    return globalWorkerPool;
}
