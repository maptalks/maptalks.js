import { createTypedArray } from './array.js';
// eslint-disable-next-line no-undef
const inWorker = typeof WorkerGlobalScope !== 'undefined' && (self instanceof WorkerGlobalScope);

const ArrayItemMixin = function (Base) {
    return class extends Base {
        pushIn(...args) {
            const len = args.length;
            for (let i = 0; i < len; i++) {
                this[this.currentIndex++] = args[i];
            }
        }

        fill(v, start, end) {
            super.fill(v, start, end);
            if (end > this.currentIndex) {
                this.currentIndex = end;
            }
        }

        set(index, v) {
            if (index >= this.currentIndex) {
                this.currentIndex = index + 1;
            }
            this[index] = v;
        }

        getLength() {
            return this.currentIndex;
        }

        setLength(len) {
            this.currentIndex = len;
            if (super.length < len) {
                super.length = len;
            }
        }

        trySetLength(len) {
            if (len > this.currentIndex) {
                this.setLength(len);
            }
        }

        reset() {
            // this.fill(0);
            this.currentIndex = 0;
        }

        slice(start, end) {
            const result = super.slice(start, end);
            result.currentIndex = end - start;
            return result;
        }
    };
}

const ArrayItem = ArrayItemMixin(Array);

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
        this.length = len;
        this.currentIndex = len;
    }

    trySetLength(len) {
        this.length = len;
        this.currentIndex = len;
    }

    getLength() {
        return this.length;
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

    static ensureCapacity(array, expectedSize) {
        if (!array.BYTES_PER_ELEMENT) {
            // only applicable to TypedArray
            return array;
        }
        const length = array.length;
        if (length >= expectedSize) {
            return array;
        }
        const newArray = new array.constructor(expectedSize + Math.ceil(0.5 * expectedSize));
        const count = array.getLength();
        for (let i = 0; i < count; i++) {
            newArray[i] = array[i];
        }
        newArray.currentIndex = array.currentIndex;
        return newArray;
    }

    static getArray(type) {
        let array;

        if (type) {
            const clazz = ArrayItemMixin(type);
            // 1M at start
            const size =  1 * 1024 * 1024  / clazz.BYTES_PER_ELEMENT;
            array = new clazz(size);
        } else {
            array = new ArrayItem();
        }
        array.push = (...args) => {
            array.pushIn(...args);
        };
        return array;
    }

    // ProxyArray性能较差，但.length 等于 getLength()的结果，主要用于需要 .length 的场合，例如earcut之类第三方库的参数
    static getProxyArray() {
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
        this._proxiedArrays = [];
        this._proxiedIndex = 0;
        this._typedArrays = {};
    }

    getProxy() {
        if (!inWorker) {
            const array = new MainThreadArrayItem();
            array.currentIndex = 0;
            return array;
        }
        const array = this._proxiedArrays[this._proxiedIndex] = this._proxiedArrays[this._proxiedIndex] || ArrayPool.getProxyArray();
        array.reset();
        this._proxiedIndex++;
        return array;
    }

    get(type) {
        if (!inWorker) {
            const array = new MainThreadArrayItem();
            array.currentIndex = 0;
            return array;
        }
        if (type) {
            const key = type.name;
            let typedArrays = this._typedArrays[key];
            if (!typedArrays) {
                typedArrays = this._typedArrays[key] = { arrays: [], index: 0 };
            }
            const index = typedArrays.index;
            const array = typedArrays.arrays[index] = typedArrays.arrays[index] || ArrayPool.getArray(type);
            array.reset();
            typedArrays.index++;
            return array;
        }
        const array = this._arrays[this._index] = this._arrays[this._index] || ArrayPool.getArray();
        array.reset();
        this._index++;
        return array;
    }

    reset() {
        this._index = 0;
        this._proxiedIndex = 0;
        for (const p in this._typedArrays) {
            this._typedArrays[p].index = 0;
        }
    }
}

arrayPool = new ArrayPool();

export default ArrayPool;
