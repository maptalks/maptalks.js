import * as maptalks from 'maptalks';
/**
 * from mapbox-gl-js
 * A [least-recently-used cache](http://en.wikipedia.org/wiki/Cache_algorithms)
 * with hash lookup made possible by keeping a list of keys in parallel to
 * an array of dictionary of values
 *
 * @public
 */
class LRUCache {
    /**
     * @param {number} max number of permitted values
     * @param {Function} onRemove callback called with items when they expire
     */
    constructor(max, onRemove) {
        this.max = max;
        this.currentSize = 0;
        this.data = new Map();
        this.onRemove = onRemove;
    }

    /**
     * Clear the cache
     *
     * @returns {LRUCache} this cache
     */
    reset(renderer) {
        if (this.data) {
            const keys = this.data.keys();
            for (const id of keys) {
                const data = this.data.get(id);
                if (!renderer || renderer === data.renderer) {
                    this._remove(id, data);
                }
            }
        }
        if (!renderer) {
            this.data = new Map();
            this.currentSize = 0;
        }
        return this;
    }

    clear(renderer) {
        this.reset(renderer);
        // delete this.onRemove;
    }

    /**
     * Add a key, value combination to the cache, trimming its size if this pushes
     * it over max length.
     *
     * @param {string} key lookup key for the item
     * @param {*} data any value
     *
     * @returns {LRUCache} this cache
     */
    add(key, data) {
        if (!data) {
            return this;
        }
        if (data.node && data.node.memorySize) {
            this.currentSize += data.node.memorySize;
        }
        if (this.has(key)) {
            const cached = this.data.get(key);
            if (cached && cached.node && cached.node.memorySize) {
                this.currentSize -= cached.node.memorySize;
            }
            this.data.delete(key);
            this.data.set(key, data);
        } else {
            this.data.set(key, data);
        }

        return this;
    }

    shrink() {
        if (this.currentSize > this.max) {
            const iterator = this.data.keys();
            let item = iterator.next();
            while (this.currentSize > this.max && item.value !== undefined) {
                if (this.data.get(item.value).current) {
                    maptalks.Util.warnOnce(`current maxGPUMemory(${this.max / 1024 / 1024}) for Geo3DTilesLayer is not enough, one or more current tiles will be discarded.`);
                }
                const removedData = this.getAndRemove(item.value);
                if (removedData) {
                    this.onRemove(removedData);
                }
                item = iterator.next();
            }
        }
    }

    /**
     * Determine whether the value attached to `key` is present
     *
     * @param {String} key the key to be looked-up
     * @returns {Boolean} whether the cache has this value
     */
    has(key) {
        return this.data.has(key);
    }

    /**
     * List all keys in the cache
     *
     * @returns {Array<string>} an array of keys in this cache.
     */
    keys() {
        const keys = new Array(this.data.size);
        let i = 0;
        const iterator = this.data.keys();
        for (const k of iterator) {
            keys[i++] = k;
        }
        return keys;
    }

    /**
     * Get the value attached to a specific key and remove data from cache.
     * If the key is not found, returns `null`
     *
     * @param {string} key the key to look up
     * @returns {*} the data, or null if it isn't found
     */
    getAndRemove(key) {
        if (!this.has(key)) { return null; }

        const data = this.data.get(key);
        if (data.node && data.node.memorySize) {
            this.currentSize -= data.node.memorySize;
        }
        this.data.delete(key);
        return data;
    }

    /**
     * Get the value attached to a specific key without removing data
     * from the cache. If the key is not found, returns `null`
     *
     * @param {string} key the key to look up
     * @returns {*} the data, or null if it isn't found
     */
    get(key) {
        if (!this.has(key)) { return null; }

        const data = this.data.get(key);
        this.data.delete(key);
        this.data.set(key, data);
        return data;
    }

    /**
     * Remove a key/value combination from the cache.
     *
     * @param {string} key the key for the pair to delete
     * @returns {LRUCache} this cache
     */
    remove(key) {
        if (!this.has(key)) { return this; }
        const data = this.data.get(key);
        this._remove(key, data);
        return this;
    }

    _remove(key, data) {
        if (data.node && data.node.memorySize) {
            this.currentSize -= data.node.memorySize;
        }
        this.data.delete(key);
        this.onRemove(data);
    }

    /**
     * Change the max size of the cache.
     *
     * @param {number} max the max size of the cache
     * @returns {LRUCache} this cache
     */
    setMaxSize(max) {
        this.max = max;

        this.shrink();

        return this;
    }

    getMemorySize() {
        let size = 0;
        const values = this.data.values();
        for (const p of values) {
            const node = p && p.node;
            if (node && node.memorySize) {
                size += node.memorySize;
            }
        }
        return size;
    }

    markAll(renderer, isCurrent) {
        const values = this.data.values();
        for (const data of values) {
            if (!renderer || data.renderer === renderer) {
                data.current = isCurrent;
            }
        }
    }
}

export default LRUCache;
