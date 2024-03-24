export const imageFetchWorkerKey = 'core-fetch-image';


let globalWorkerPool;
export function setWorkerPool(pool) {
    globalWorkerPool = pool;
}

export function getWorkerPool() {
    return globalWorkerPool;
}
let workersCreated = false;

export function setWorkersCreated() {
    workersCreated = true;
}
export function workersHasCreated() {
    return workersCreated;
}

const ADAPTER_CREATED_LIST = [];

export function adapterHasCreated(workerKey) {
    return ADAPTER_CREATED_LIST.indexOf(workerKey) > -1;
}

export function pushAdapterCreated(workerKey) {
    if (!adapterHasCreated(workerKey)) {
        ADAPTER_CREATED_LIST.push(workerKey);
    }
}
