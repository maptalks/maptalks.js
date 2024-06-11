import { createTypedArray } from './array.js';
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
    };
}

const ArrayItem = ArrayItemMixin(Array);

// const ArrayItemProxy = {
//   get: function(target, property) {
//     if (property === 'length') {
//         return target.getLength();
//     }
//     return target[property];
//   }
// };

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

    constructor() {
        this._arrays = [];
        this._index = 0;
        this._typedArrays = {};
    }

    get(type) {
        if (!inWorker) {
            return new MainThreadArrayItem();
        }
        if (type) {
            const key = type.name;
            if (!this._typedArrays[key]) {
                this._typedArrays[key] = { arrays: [], index: 0 };
            }
            const index = this._typedArrays[key].index;
            const array = this._typedArrays[key].arrays[index] || ArrayPool.getArray(type);
            array.reset();
            this._typedArrays[key].index++;
            return array;
        }
        const array = this._arrays[this._index] = this._arrays[this._index] || ArrayPool.getArray();
        array.reset();
        this._index++;
        return array;
    }

    reset() {
        this._index = 0;
        for (const p in this._typedArrays) {
            this._typedArrays[p].index = 0;
        }
    }
}

arrayPool = new ArrayPool();

export default ArrayPool;
