import { createTypedArray } from './array.js';
const inWorker = typeof WorkerGlobalScope !== 'undefined' && (self instanceof WorkerGlobalScope);

class ArrayItem extends Array {

    pushIn(...args) {
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

class MainThreadArrayItem extends Array {
    // 主线程中不能重用array，返回新的array对象，并实现setLength和trySetLength方法

    setLength(len) {
        super.length = len;
    }

    trySetLength(len) {
        super.length = len;
    }

    getLength() {
        return super.length;
    }
}

let arrayPool;

class ArrayPool {
    static createTypedArray(values, ctor) {
        return createTypedArray(values, ctor);
    }

    static getInstance() {
        return arrayPool;
    }

    static getArray() {
        const array = new ArrayItem();
        const proxy = new Proxy(array, ArrayItemProxy);
        // 通过Proxy代理array的push，性能非常慢，改为直接定义一个push并调用array上的pushIn方法
        proxy.push = (...args) => {
            array.pushIn(...args);
        };
        proxy._origin = array;
        return proxy;
    }

    constructor() {
        this._arrays = [];
        this._index = 0;
    }

    get() {
        if (!inWorker) {
            return new MainThreadArrayItem();
        }
        const array = this._arrays[this._index] = this._arrays[this._index] || ArrayPool.getArray();
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
