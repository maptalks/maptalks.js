export default class LRUPool {
    constructor(max, onRemove) {
        this.max = max;
        this.onRemove = onRemove;
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
        } else {
            this.data.set(key, data);
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

    pop() {
        if (this.data.size < this.max) {
            return null;
        }
        const first = this.data.keys().next();
        const data = this.data.get(first.value);
        if (data.current) {
            this.max += Math.ceil(this.max / 2);
            return null;
        }
        return this.getAndRemove(first.value);
    }

    remove(key) {
        if (!this.has(key)) { return this; }

        const data = this.data.get(key);
        this.data.delete(key);
        this.onRemove(data);

        return this;
    }

    resetCurrent(current) {
        if (!this.data) {
            return;
        }
        this.data.forEach(v => {
            v.current = current;
        });
    }
}
