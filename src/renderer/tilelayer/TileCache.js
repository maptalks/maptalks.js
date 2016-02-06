Z.TileLayer.TileCache=function(capacity) {
    this._queue = [];
    this._cache = {};
    if (!capacity) {
        capacity = 128;
    }
    this.capacity = capacity;
};

Z.Util.extend(Z.TileLayer.TileCache.prototype, {
    add:function(key, tile) {
        this._cache[key] = tile;
        this._queue.push(key);
        this._expireCache();
    },

    get:function(key) {
        return this._cache[key];
    },

    remove:function(key) {
        delete this._cache[key];
    },

    _expireCache:function() {
        if (this._expTimeout) {
            clearTimeout(this._expTimeout);
        }
        var me = this;
        this._expTimeout = setTimeout(function() {
            var len = me._queue.length;
            if (len > me.capacity) {
                var expir = me._queue.splice(0, len-me.capacity);
                for (var i = expir.length - 1; i >= 0; i--) {
                    delete me._cache[expir[i]];
                }
            }
        },1000);

    }
});
