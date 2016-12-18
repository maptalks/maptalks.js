export function now() {
    if (!Date.now) {
        return new Date().getTime();
    }
    return Date.now();
}

/**
 * Extend a object with one or more source objects.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 */
export function extend(dest) { // (Object[, Object, ...]) ->
    for (var i = 1; i < arguments.length; i++) {
        var src = arguments[i];
        for (var k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}

/**
 * Object.create or a polyfill in old browsers.
 * @function
 * @param {Object} proto - the proto to create on.
 * @return {Object}
 */
const create = Object.create || (function () {
    function F() {}
    return function (proto) {
        F.prototype = proto;
        return new F();
    };
})();
export { create };

/**
 * Function.bind or a polyfill in old browsers.
 * @param {Function} fn     - function to bind
 * @param {Object} obj      - context to bind
 * @return {Function} function binded.
 */
export function bind(fn, obj) {
    var slice = Array.prototype.slice;
    if (fn.bind) {
        return fn.bind.apply(fn, slice.call(arguments, 1));
    }
    var args = slice.call(arguments, 2);
    return function () {
        return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
}

/**
 * from leaflet <br>
 * return a function that won't be called more often than the given interval
 *
 * @param  {Function} fn      - function to call
 * @param  {Number}   time    - interval to throttle
 * @param  {Object}   context - function's context
 * @return {Function} the throttled function
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
        if (lock) {
            // called too soon, queue to call later
            args = arguments;

        } else {
            // call and lock until later
            fn.apply(context, arguments);
            setTimeout(later, time);
            lock = true;
        }
    };

    return wrapperFn;
}

/*
 * Whether the object is null or undefined.
 * @param  {Object}  obj - object
 * @return {Boolean}
 */
export function isNil(obj) {
    return obj == null;
}

/*
 * Whether val is a number and not a NaN.
 * @param  {Object}  val - val
 * @return {Boolean}
 */
export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}

/*
 * Whether the obj is a javascript object.
 * @param  {*}  obj     - object to check
 * @return {Boolean}
 */
export function isObject(obj) {
    return typeof obj === 'object' && !!obj;
}

/*
 * 判断是否数组
 * @param {Object} obj
 * @return {Boolean} true|false
 */
export function isArray(obj) {
    if (!obj) {
        return false;
    }
    if (Array.isArray) {
        return Array.isArray(obj);
    }
    return Object.prototype.toString.call(obj) === '[object Array]';
}

/**
 * 判断是否字符串
 * @param {Object} str
 * @return {Boolean} true|false
 */
export function isString(str) {
    if (isNil(str)) {
        return false;
    }
    return typeof str === 'string' || (str.constructor !== null && str.constructor === String);
}

/*
 * 判断是否函数
 * @param {Object} fn
 * @return {Boolean} true|false
 */
export function isFunction(fn) {
    if (this.isNil(fn)) {
        return false;
    }
    return typeof fn === 'function' || (fn.constructor !== null && fn.constructor === Function);
}

/**
 * Check whether the object has the property.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
}
