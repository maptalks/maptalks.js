export function now() {
    if (!Date.now) {
        return new Date().getTime();
    }
    return Date.now();
}

/**
 * @classdesc
 * Utilities methods used internally. It is static and should not be initiated.
 * @class
 * @static
 * @category core
 * @name Util
 */

/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 * @memberOf Util
 */
export function extend(dest) { // (Object[, Object, ...]) ->
    for (let i = 1; i < arguments.length; i++) {
        let src = arguments[i];
        for (let k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}

/**
 * From leaflet <br>
 * return a function that won't be called more often than the given interval
 *
 * @param  {Function} fn      - function to call
 * @param  {Number}   time    - interval to throttle
 * @param  {Object}   context - function's context
 * @return {Function} the throttled function
 * @memberOf Util
 */
export function throttle(fn, time, context) {
    var lock, args, wrapperFn, later;

    later = function () {
        // reset lock and call if queued
        lock = false;
        if (args) {
            wrapperFn.apply(context, args);
            args = false;
        }
    };

    wrapperFn = function () {
        if (lock && wrapperFn.time > 0) {
            // called too soon, queue to call later
            args = arguments;

        } else {
            // call and lock until later
            fn.apply(context, arguments);
            setTimeout(later, wrapperFn.time);
            lock = true;
        }
    };

    wrapperFn.time = time;

    return wrapperFn;
}

/**
 * Whether the object is null or undefined.
 * @param  {Object}  obj - object
 * @return {Boolean}
 * @memberOf Util
 */
export function isNil(obj) {
    return obj == null;
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
 * Whether a number is an integer
 * @param  {Number}  n
 * @return {Boolean}
 * @memberOf Util
 */
export function isInteger(n) {
    return (n | 0) === n;
}

/**
 * Whether the obj is a javascript object.
 * @param  {Object}  obj  - object
 * @return {Boolean}
 * @memberOf Util
 */
export function isObject(obj) {
    return typeof obj === 'object' && !!obj;
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

const hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * Check whether the object owns the property.
 * @param  {Object}  obj - object
 * @param  {String}  key - property
 * @return {Boolean}
 * @memberOf Util
 */
export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
}

/**
 * Join an array, standard or a typed one.
 * @param  {Object[]} arr       array to join
 * @param  {String} seperator  seperator
 * @return {String}           result string
 */
export function join(arr, seperator) {
    if (arr.join) {
        return arr.join(seperator || ',');
    } else {
        return Array.prototype.join.call(arr, seperator || ',');
    }
}
