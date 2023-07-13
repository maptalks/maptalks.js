export const imageFetchWorkerKey = 'core-fetch-image';


let globalWorkerPool;
export function setGlobalWorkerPool(pool) {
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
