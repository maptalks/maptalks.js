declare let requestAnimFrame: any, cancelAnimFrame: any;
export { requestAnimFrame, cancelAnimFrame };
export declare function isSVG(url: string): 0 | 1 | 2;
/**
 * Load a image, can be a remote one or a local file. <br>
 * If in node, a SVG image will be converted to a png file by [svg2img]{@link https://github.com/FuZhenn/node-svg2img}<br>
 * @param  {Image} img  - the image object to load.
 * @param  {Object[]} imgDesc - image's descriptor, it's an array. imgUrl[0] is the url string, imgUrl[1] is the width, imgUrl[2] is the height.
 * @private
 * @memberOf Util
 */
export declare function loadImage(img: any, imgDesc: any): void;
export declare function UID(): number;
export declare const GUID: typeof UID;
/**
 * Parse a JSON string to a object
 * @param {String} str      - a JSON string
 * @return {Object}
 * @memberOf Util
 */
export declare function parseJSON(str: string): any;
export declare function pushIn(dest: any): any;
export declare function removeFromArray(obj: any, array: Array<any>): void;
export declare function forEachCoord(arr: any, fn: any, context?: any): any;
export declare function getValueOrDefault(v: any, d: any): any;
/**
 * Polyfill for Math.sign
 * @param  {Number} x
 * @return {Number}
 * @memberOf Util
 */
export declare function sign(x: number): number;
export declare function log2(x: number): number;
export declare function interpolate(a: any, b: any, t: any): number;
export declare function wrap(n: any, min: any, max: any): any;
/**
 * constrain n to the given range via min + max
 *
 * @param {Number} n value
 * @param {Number} min the minimum value to be returned
 * @param {Number} max the maximum value to be returned
 * @returns {Number} the clamped value
 * @private
 */
export declare function clamp(n: any, min: any, max: any): number;
export declare function isArrayHasData(obj: Array<any>): boolean;
/**
 * Whether the input string is a valid url.
 * form: https://github.com/axios/axios/blob/master/lib/helpers/isAbsoluteURL.js
 * @param  {String}  url - url to check
 * @return {Boolean}
 * @memberOf Util
 * @private
 */
export declare function isURL(url: string): boolean;
export declare function isCssUrl(str: string): 0 | 1 | 2 | 3;
export declare function extractCssUrl(str: string): any;
/**
 * btoa or a polyfill in old browsers. <br>
 * Creates a base-64 encoded ASCII string from a String object in which each character in the string is treated as a byte of binary data.<br>
 * From https://github.com/davidchambers/Base64.js
 * @param  {Buffer} input - input string to convert
 * @return {String} ascii
 * @memberOf Util
 * @example
 *     const encodedData = Util.btoa(stringToEncode);
 */
export declare function btoa(input: string): string;
export declare function b64toBlob(b64Data: string, contentType: string): Blob;
/**
 * Compute degree bewteen 2 points.
 * @param  {Number} x0
 * @param  {Number} y0
 * @param  {Number} x1
 * @param  {Number} y1
 * @return {Number}    degree between 2 points
 * @memberOf Util
 */
export declare function computeDegree(x0: number, y0: number, x1: number, y1: number): number;
/**
 * Transparent 1X1 gif image
 * from https://css-tricks.com/snippets/html/base64-encode-of-1x1px-transparent-gif/
 * @type {String}
 * @memberOf Util
 */
export declare const emptyImageUrl = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
/**
 * shallow equal
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Boolean}
 * @private
 * @memberOf Util
 */
export declare function equalMapView(obj1: any, obj2: any): boolean;
/**
 * Flash something, show and hide by certain internal for times of count.
 *
 * @param {Number} [interval=100]     - interval of flash, in millisecond (ms)
 * @param {Number} [count=4]          - flash times
 * @param {Function} [cb=null]        - callback function when flash ended
 * @param {*} [context=null]          - callback context
 * @return {*} this
 * @private
 * @memberOf Util
 */
export declare function flash(interval: any, count: any, cb: any, context: any): any;
export declare function _defaults(obj: any, defaults: any): any;
export declare function getPointsResultPts(points?: any[], ptKey?: string): any[];
export declare function getImageBitMap(data: any, cb: any): void;
export declare function getAbsoluteURL(url: string): string;
export declare function calCanvasSize(size: any, devicePixelRatio?: number): {
    cssWidth: string;
    cssHeight: string;
    width: number;
    height: number;
};
