let id = 0;
export function uid() {
    return id++;
}

/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 * @memberOf Util
 */
export function extend(dest) { // (Object[, Object, ...]) ->
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
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

export function isNil(obj) {
    return obj == null;
}

//push elements in source to target
//faster than target.concat(source)
//https://jsperf.com/array-concat-vs-push-2/16
export function pushIn(target, source) {
    for (let i = 0, l = source.length; i < l; i++) {
        target.push(source[i]);
    }
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
        if (params[p] && params[p].toJSON) {
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
