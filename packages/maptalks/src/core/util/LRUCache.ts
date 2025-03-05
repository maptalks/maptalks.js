/* eslint-disable @typescript-eslint/ban-types */
class LRUCache {
    max: number
    onRemove: Function
    data: any
    constructor(max: number, onRemove?: Function) {
        const nullOnRemove = () => { };
        this.max = max;
        this.onRemove = onRemove || nullOnRemove;
        this.reset();
    }

    reset() {
        if (this.data) {
            const values = this.data.values();
            for (const p of values) {
                this.onRemove(p);
            }
        }

        this.data = new Map();
        return this;
    }

    clear() {
        this.reset();
        delete this.onRemove;
    }

    add(key, data) {
        if (!data) {
            return this;
        }
        if (this.has(key)) {
            this.data.delete(key);
            this.data.set(key, data);
            // if (this.data.size > this.max) {
            //     this.shrink();
            // }
        } else {
            this.data.set(key, data);
            // if (this.data.size > this.max) {
            //     this.shrink();
            // }
        }

        return this;
    }

    keys() {
        const keys = new Array(this.data.size);
        let i = 0;
        const iterator = this.data.keys();
        for (const k of iterator) {
            keys[i++] = k;
        }
        return keys;
    }


    shrink() {
        const iterator = this.data.keys();
        let item = iterator.next();
        while (this.data.size > this.max) {
            const removedData = this.getAndRemove(item.value);
            if (removedData) {
                this.onRemove(removedData);
            }
            item = iterator.next();
        }
    }

    has(key) {
        return this.data.has(key);
    }


    getAndRemove(key) {
        if (!this.has(key)) { return null; }

        const data = this.data.get(key);
        this.data.delete(key);
        return data;
    }


    get(key) {
        if (!this.has(key)) { return null; }

        const data = this.data.get(key);
        return data;
    }

    remove(key) {
        if (!this.has(key)) { return this; }

        const data = this.data.get(key);
        this.data.delete(key);
        this.onRemove(data);

        return this;
    }

    setMaxSize(max) {
        this.max = max;
        if (this.data.size > this.max) {
            this.shrink();
        }
        return this;
    }
}

export default LRUCache;
