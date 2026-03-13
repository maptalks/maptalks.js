
// eslint-disable-next-line no-undef
const inWorker = typeof WorkerGlobalScope !== 'undefined' && (self instanceof WorkerGlobalScope);

class ArrayBufferPool {
    constructor() {
        this._pool = {};
    }

    get(size) {
        if (!inWorker) {
            return new ArrayBuffer(size);
        }
        const bucketSize = this._getBucketSize(size);
        const bucket = this._pool[bucketSize];
        if (bucket && bucket.length > 0) {
            return bucket.pop();
        }
        return new ArrayBuffer(bucketSize);
    }

    return(buffer) {
        if (!inWorker || !buffer || !(buffer instanceof ArrayBuffer)) {
            return;
        }
        const size = buffer.byteLength;
        // Verify if it's a power of 2 size we expect
        if ((size & (size - 1)) !== 0) {
            return;
        }
        const bucket = this._pool[size] = this._pool[size] || [];
        // Optional: limit pool size per bucket to avoid excessive memory usage
        if (bucket.length < 100) {
            bucket.push(buffer);
        }
    }

    _getBucketSize(size) {
        let n = 1024;
        while (n < size) {
            n *= 2;
        }
        return n;
    }
}

let instance;
if (inWorker) {
    instance = new ArrayBufferPool();
}

export default instance;
