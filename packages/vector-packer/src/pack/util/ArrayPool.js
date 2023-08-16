import { createTypedArray } from './array.js';

class ArrayItem extends Array {

    push(...args) {
        const len = args.length;
        for (let i = 0; i < len; i++) {
            this[this._index++] = args[i];
        }
    }

    fill(v, start, end) {
        super.fill(v, start, end);
        if (end > this._index) {
            this._index = end;
        }
    }

    set(index, v) {
        if (index >= this._index) {
            this._index = index + 1;
        }
        this[index] = v;
    }

    getLength() {
        return this._index;
    }

    setLength(len) {
        this._index = len;
        if (super.length < len) {
            super.length = len;
        }
    }

    trySetLength(len) {
        if (len > this._index) {
            this.setLength(len);
        }
    }

    reset() {
        // this.fill(0);
        this._index = 0;
    }

}

const ArrayItemProxy = {
  get: function(target, property) {
    if (property === 'length') {
        return target.getLength();
    }
    return target[property];
  }
};

let arrayPool;

class ArrayPool {
    static createTypedArray(values, ctor) {
        return createTypedArray(values, ctor);
    }

    static getInstance() {
        return arrayPool;
    }

    constructor() {
        this._arrays = [];
        this._index = 0;
    }

    get() {
        const array = this._arrays[this._index] = this._arrays[this._index] || new Proxy(new ArrayItem(), ArrayItemProxy);
        array.reset();
        this._index++;
        return array;
    }

    reset() {
        this._index = 0;
    }
}

arrayPool = new ArrayPool();

export default ArrayPool;
