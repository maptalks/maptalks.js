import { isFunctionDefinition } from '@maptalks/function-type';


let id = 0;
export function uid() {
    return id++;
}

const supportAssign = typeof Object.assign === 'function';

/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 * @memberOf Util
 */
export function extend(dest, ...source) { // (Object[, Object, ...]) ->
    if (supportAssign) {
        Object.assign(dest, ...source);
        return dest;
    }
    for (let i = 0; i < source.length; i++) {
        const src = source[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}


/**
 * Check whether the object is a string
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
export function isString(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'string' || (obj.constructor !== null && obj.constructor === String);
}

/**
 * Whether val is a number and not a NaN.
 * @param  {Object}  val - val
 * @return {Boolean}
 * @memberOf Util
 */
export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}

/**
 * Check whether the object is a function
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
export function isFunction(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'function' || (obj.constructor !== null && obj.constructor === Function);
}

/**
 * Whether the obj is a javascript object.
 * @param  {Object}  obj  - object
 * @return {Boolean}
 * @memberOf Util
 */
export function isObject(obj) {
    return !Array.isArray(obj) && typeof obj === 'object' && !!obj;
}

export function isNil(obj) {
    return obj == null;
}

//push elements in source to target
//faster than target.concat(source)
//https://jsperf.com/array-concat-vs-push-2/16
export function pushIn(dest) {
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        if (src) {
            for (let ii = 0, ll = src.length; ii < ll; ii++) {
                dest.push(src[ii]);
            }
        }
    }
    return dest.length;
}

export function asyncAll(array, fn, callback) {
    if (!array.length) { callback(null, []); }
    let remaining = array.length;
    const results = new Array(array.length);
    let error = null;
    array.forEach((item, i) => {
        fn(item, (err, result) => {
            if (err) error = err;
            results[i] = result;
            if (--remaining === 0) callback(error, results);
        });
    });
}

export function toJSON(params) {
    const r = {};
    for (const p in params) {
        if (params[p] === undefined || params[p] === null) {
            continue;
        }
        if (params[p].toJSON) {
            r[p] = params[p].toJSON();
        } else {
            r[p] = params[p];
        }
    }
    return r;
}


/**
 * Polyfill for Math.sign
 * @param  {Number} x
 * @return {Number}
 * @memberOf Util
 */
/* istanbul ignore next */
export function sign(x) {
    if (Math.sign) {
        return Math.sign(x);
    }
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return Number(x);
    }
    return x > 0 ? 1 : -1;
}

export function log2(x) {
    if (Math.log2) {
        return Math.log2(x);
    }
    const v = Math.log(x) * Math.LOG2E;
    const rounded = Math.round(v);
    if (Math.abs(rounded - v) < 1E-14) {
        return rounded;
    } else {
        return v;
    }
}

export function exportIndices(indices) {
    // return indices.length <= 256 ? new Uint8Array(indices)  : indices.length <= 65536 ? new Uint16Array(indices) : new Uint32Array(indices);
    // Uint8Array performs badly in directx according to ANGLE
    return indices.length < 65536 ? new Uint16Array(indices) : new Uint32Array(indices);
}

export function isFnTypeSymbol(v) {
    return isFunctionDefinition(v) && v.property;
}

export function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}



export function getCentiMeterScale(res, map) {
    let p = map.altitudeToPoint(100, res);
    const heightFactor = map.options['heightFactor'];
    if (heightFactor && heightFactor !== 1) {
        p /= heightFactor;
    }
    // to centimeter
    return p / 100 / 100;
}

export function equalsArray(self, array) {
    if (!self || !array)
        return false;

    if (self.length != array.length)
        return false;

    for (let i = 0, l = self.length; i < l; i++) {
        if (self[i] !== array[i]) {
            return false;
        }
    }
    return true;
}

export function wrap(n, min, max) {
    if (n === max || n === min) {
        return n;
    }
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return w;
}
