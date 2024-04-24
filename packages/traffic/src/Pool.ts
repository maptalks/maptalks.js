export default class Pool {
    constructor(factory, pool) {
        let k, v, ref;
        this.factory = factory;
        this.objects = {};
        if ((pool != null) && (pool.objects != null)) {
            ref = pool.objects;
            for (k in ref) {
                v = ref[k];
                this.objects[k] = this.factory.copy(v);
            }
        }
    }

    get length() {
        return Object.keys(this.objects).length;
    }

    toJSON() {
        return this.objects;
    }

    get(id) {
        return this.objects[id];
    }

    put(obj) {
        return this.objects[obj.id] = obj;
    }

    pop(obj) {
        let ref;
        const id = (ref = obj.id) != null ? ref : obj;
        const result = this.objects[id];
        if (typeof result.release === "function") {
            result.release();
        }
        delete this.objects[id];
        return result;
    }

    all() {
        return this.objects;
    }

    clear() {
        return this.objects = {};
    }
}
