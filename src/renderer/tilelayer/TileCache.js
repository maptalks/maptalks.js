export class TileCache {
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
        var me = this;
        this._expTimeout = setTimeout(function () {
            var len = me._queue.length;
            if (len > me.capacity) {
                var expir = me._queue.splice(0, len - me.capacity);
                for (var i = expir.length - 1; i >= 0; i--) {
                    delete me._cache[expir[i]];
                }
            }
        }, 1000);
    }
}
