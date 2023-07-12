export const imageFetchWorkerKey = 'core-fetch-image';


let globalWorkerPool;
export function setGlobalWorkerPool(pool) {
    globalWorkerPool = pool;
}

export function getWorkerPool() {
    return globalWorkerPool;
}

export function workerPoolHasCreated() {
    return globalWorkerPool;
}
