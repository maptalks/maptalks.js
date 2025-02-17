/* eslint-disable @typescript-eslint/ban-types */

export function now() {
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
 * @param dest
 * @param source
 * @return
 * @module Util
 */
export function extend<T extends {}, U>(dest: T, source: U): T & U;
export function extend<T extends {}, U, V>(dest: T, source1: U, source2: V): T & U & V;
export function extend<T extends {}, U, V, W>(dest: T, source1: U, source2: V, source3: W): T & U & V & W;
export function extend<T extends {}, U, V, W, X>(dest: T, source1: U, source2: V, source3: W, source4: X): T & U & V & W & X;
export function extend(dest: object, ...args: Array<any>): any;
export function extend(dest: object, ...args: Array<any>) { // (Object[, Object, ...]) ->
    for (let i = 0; i < args.length; i++) {
        const src = args[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}

/**
 * Whether the object is null or undefined.
 * @param  obj - object
 * @return
 * @memberOf Util
 */
export function isNil(obj: Object): obj is null {
    return obj == null;
}

/**
 * Whether val is a number and not a NaN.
 * @param  val - val
 * @return
 * @memberOf Util
 */
export function isNumber(val: Object): val is number {
    return (typeof val === 'number') && !isNaN(val);
}

/**
 * Whether a number is an integer
 * @param  n
 * @return
 * @memberOf Util
 */
export function isInteger(n: number) {
    return (n | 0) === n;
}

/**
 * Whether the obj is a javascript object.
 * @param obj  - object
 * @return
 * @memberOf Util
 */
export function isObject(obj: Object): obj is object {
    return typeof obj === 'object' && !!obj;
}

/**
 * Check whether the object is a string
 * @param obj
 * @return
 * @memberOf Util
 */
export function isString(obj: Object): obj is string {
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
export function isFunction(obj: Object): obj is Function {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'function' || (obj.constructor !== null && obj.constructor === Function);
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Check whether the object owns the property.
 * @param obj - object
 * @param key - property
 * @return
 * @memberOf Util
 */
export function hasOwn(obj: Object, key: string): boolean {
    return hasOwnProperty.call(obj, key);
}

/**
 * Join an array, standard or a typed one.
 * @param  arr       array to join
 * @param  seperator  seperator
 * @return  result string
 * @private
 * @memberOf Util
 */
export function join(arr: Object[], seperator: string): string {
    if (arr.join) {
        return arr.join(seperator || ',');
    } else {
        return Array.prototype.join.call(arr, seperator || ',');
    }
}

/**
 * Determine if an object has any properties.
 * @param object The object to check.
 * @returns The object is empty
 * @memberOf Util
 */
export function isEmpty(object: Object) {
    let property;
    for (property in object) {
        return false;
    }
    return !property;
}

const pi = Math.PI / 180;

export function toRadian(d: number) {
    return d * pi;
}

export function toDegree(r: number) {
    return r / pi;
}
