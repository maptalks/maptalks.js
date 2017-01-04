export default class TileCache {
    constructor(capacity) {
        this._queue = [];
        this._cache = {};
        if (!capacity) {
            capacity = 128;
        }
        this.capacity = capacity;
    }

    add(key, tile) {
        this._cache[key] = tile;
        this._queue.push(key);
        this._expireCache();
    }

    get(key) {
        return this._cache[key];
    }

    remove(key) {
        delete this._cache[key];
    }

    _expireCache() {
        if (this._expTimeout) {
            clearTimeout(this._expTimeout);
        }
        this._expTimeout = setTimeout(() => {
            const len = this._queue.length;
            if (len > this.capacity) {
                const expir = this._queue.splice(0, len - this.capacity);
                for (let i = expir.length - 1; i >= 0; i--) {
                    delete this._cache[expir[i]];
                }
            }
        }, 1000);
    }
}
