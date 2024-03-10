export declare function now(): number;
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
export declare function extend(dest: object, ...objects: any[]): object;
/**
 * Whether the object is null or undefined.
 * @param  {Object}  obj - object
 * @return {Boolean}
 * @memberOf Util
 */
export declare function isNil(obj: any): boolean;
/**
 * Whether val is a number and not a NaN.
 * @param  {Object}  val - val
 * @return {Boolean}
 * @memberOf Util
 */
export declare function isNumber(val: any): boolean;
/**
 * Whether a number is an integer
 * @param  {Number}  n
 * @return {Boolean}
 * @memberOf Util
 */
export declare function isInteger(n: any): boolean;
/**
 * Whether the obj is a javascript object.
 * @param  {Object}  obj  - object
 * @return {Boolean}
 * @memberOf Util
 */
export declare function isObject(obj: any): boolean;
/**
 * Check whether the object is a string
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
export declare function isString(obj: any): boolean;
/**
 * Check whether the object is a function
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
export declare function isFunction(obj: any): boolean;
/**
 * Check whether the object owns the property.
 * @param  {Object}  obj - object
 * @param  {String}  key - property
 * @return {Boolean}
 * @memberOf Util
 */
export declare function hasOwn(obj: any, key: any): any;
/**
 * Join an array, standard or a typed one.
 * @param  {Object[]} arr       array to join
 * @param  {String} seperator  seperator
 * @return {String}           result string
 * @private
 * @memberOf Util
 */
export declare function join(arr: Array<any>, seperator: string): any;
/**
 * Determine if an object has any properties.
 * @param object The object to check.
 * @returns {boolean} The object is empty
 * @memberOf Util
 */
export declare function isEmpty(object: any): boolean;
export declare function toRadian(d: number): number;
export declare function toDegree(r: number): number;
