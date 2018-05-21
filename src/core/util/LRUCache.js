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
        this.onRemove = onRemove;
        this.reset();
    }

    /**
     * Clear the cache
     *
     * @returns {LRUCache} this cache
     */
    reset() {
        for (const key in this.data) {
            this.onRemove(this.data[key]);
        }

        this.data = {};
        this.order = [];

        return this;
    }

    clear() {
        this.reset();
        delete this.onRemove;
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

        if (this.has(key)) {
            this.order.splice(this.order.indexOf(key), 1);
            this.data[key] = data;
            this.order.push(key);

        } else {
            this.data[key] = data;
            this.order.push(key);

            if (this.order.length > this.max) {
                const removedData = this.getAndRemove(this.order[0]);
                if (removedData) this.onRemove(removedData);
            }
        }

        return this;
    }

    /**
     * Determine whether the value attached to `key` is present
     *
     * @param {String} key the key to be looked-up
     * @returns {Boolean} whether the cache has this value
     */
    has(key) {
        return key in this.data;
    }

    /**
     * List all keys in the cache
     *
     * @returns {Array<string>} an array of keys in this cache.
     */
    keys() {
        return this.order;
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

        const data = this.data[key];

        delete this.data[key];
        this.order.splice(this.order.indexOf(key), 1);

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

        const data = this.data[key];
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

        const data = this.data[key];
        delete this.data[key];
        this.onRemove(data);
        this.order.splice(this.order.indexOf(key), 1);

        return this;
    }

    /**
     * Change the max size of the cache.
     *
     * @param {number} max the max size of the cache
     * @returns {LRUCache} this cache
     */
    setMaxSize(max) {
        this.max = max;

        while (this.order.length > this.max) {
            const removedData = this.getAndRemove(this.order[0]);
            if (removedData) this.onRemove(removedData);
        }

        return this;
    }
}

export default LRUCache;
