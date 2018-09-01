import { IS_NODE } from './env';
import { isString, isNil } from './common';

// RequestAnimationFrame, inspired by Leaflet
let requestAnimFrame, cancelAnimFrame;
/* istanbul ignore next */
(function () {
    if (IS_NODE) {
        requestAnimFrame = function (fn) {
            return setTimeout(fn, 16);
        };

        cancelAnimFrame = clearTimeout;
        return;
    }

    let requestFn, cancelFn;
    // slow down fps in IE9 for performance
    const timeToCall = 1000 / 30;
    function timeoutDefer(fn) {
        return setTimeout(fn, timeToCall);
    }

    function getPrefixed(name) {
        return window['webkit' + name] || window['moz' + name] || window['ms' + name];
    }
    if (typeof (window) != 'undefined') {
        // inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

        requestFn = window['requestAnimationFrame'] || getPrefixed('RequestAnimationFrame') || timeoutDefer;
        cancelFn = window['cancelAnimationFrame'] || getPrefixed('CancelAnimationFrame') ||
            getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };
    } else {
        requestFn = timeoutDefer;
        cancelFn = clearTimeout;
    }
    /**
     * Polyfill of RequestAnimationFrame
     * @param  {Function} fn callback
     * @return {Number}      request id
     * @memberOf Util
     */
    requestAnimFrame = function (fn) {
        return requestFn(fn);
    };

    /**
     * Polyfill of cancelAnimationFrame
     * @param  {Number}      request id
     * @memberOf Util
     */
    cancelAnimFrame = function (id) {
        if (id) {
            cancelFn(id);
        }
    };
})();
export { requestAnimFrame, cancelAnimFrame };

export function isSVG(url) {
    const prefix = 'data:image/svg+xml';
    if (url.length > 4 && url.slice(-4) === '.svg') {
        return 1;
    } else if (url.slice(0, prefix.length) === prefix) {
        return 2;
    }
    return 0;
}

/**
 * Load a image, can be a remote one or a local file. <br>
 * If in node, a SVG image will be converted to a png file by [svg2img]{@link https://github.com/FuZhenn/node-svg2img}<br>
 * @param  {Image} img  - the image object to load.
 * @param  {Object[]} imgDesc - image's descriptor, it's an array. imgUrl[0] is the url string, imgUrl[1] is the width, imgUrl[2] is the height.
 * @private
 * @memberOf Util
 */
export function loadImage(img, imgDesc) {
    /* istanbul ignore next */
    if (IS_NODE && loadImage.node) {
        loadImage.node(img, imgDesc);
        return;
    }
    img.src = imgDesc[0];
}

let uid = 0;

export function UID() {
    return uid++;
}
export const GUID = UID;

/**
 * Parse a JSON string to a object
 * @param {String} str      - a JSON string
 * @return {Object}
 * @memberOf Util
 */
export function parseJSON(str) {
    if (!str || !isString(str)) {
        return str;
    }
    return JSON.parse(str);
}

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

export function removeFromArray(obj, array) {
    const i = array.indexOf(obj);
    if (i > -1) {
        array.splice(i, 1);
    }
}

export function forEachCoord(arr, fn, context) {
    if (!Array.isArray(arr)) {
        return context ? fn.call(context, arr) : fn(arr);
    }
    const result = [];
    let p, pp;
    for (let i = 0, len = arr.length; i < len; i++) {
        p = arr[i];
        if (isNil(p)) {
            result.push(null);
            continue;
        }
        if (Array.isArray(p)) {
            result.push(forEachCoord(p, fn, context));
        } else {
            pp = context ? fn.call(context, p) : fn(p);
            result.push(pp);
        }

    }
    return result;
}

export function getValueOrDefault(v, d) {
    return v === undefined ? d : v;
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

/*
 * Interpolate between two number.
 *
 * @param {Number} from
 * @param {Number} to
 * @param {Number} t interpolation factor between 0 and 1
 * @returns {Number} interpolated color
 */
export function interpolate(a, b, t) {
    return (a * (1 - t)) + (b * t);
}

/*
 * constrain n to the given range, via modular arithmetic
 * @param {Number} n value
 * @param {Number} min the minimum value to be returned, inclusive
 * @param {Number} max the maximum value to be returned, inclusive
 * @returns {Number} constrained number
 * @private
 */
export function wrap(n, min, max) {
    if (n === max || n === min) {
        return n;
    }
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return w;
}

/**
 * constrain n to the given range via min + max
 *
 * @param {Number} n value
 * @param {Number} min the minimum value to be returned
 * @param {Number} max the maximum value to be returned
 * @returns {Number} the clamped value
 * @private
 */
export function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

/*
 * Is object an array and not empty.
 * @param {Object} obj
 * @return {Boolean} true|false
 * @private
 * @memberOf Util
 */
export function isArrayHasData(obj) {
    return Array.isArray(obj) && obj.length > 0;
}

/**
 * Whether the input string is a valid url.
 * @param  {String}  url - url to check
 * @return {Boolean}
 * @memberOf Util
 * @private
 */
export function isURL(url) {
    if (!url) {
        return false;
    }
    const head = url.slice(0, 6);
    if (head === 'http:/' || head === 'https:' || head === 'file:/') {
        return true;
    }
    return false;
}

//改原先的regex名字为xWithQuote；不带引号的regex，/^url\(([^\'\"].*[^\'\"])\)$/i，为xWithoutQuote。然后在is函数里||测试，extract函数里if...else处理。没引号的匹配后，取matches[1]

// match: url('x'), url("x").
// TODO: url(x)
const cssUrlReWithQuote = /^url\((['"])(.+)\1\)$/i;

const cssUrlRe = /^url\(([^'"].*[^'"])\)$/i;

export function isCssUrl(str) {
    if (!isString(str)) {
        return 0;
    }
    const head = str.slice(0, 6);
    if (head === 'http:/' || head === 'https:') {
        return 3;
    }
    if (cssUrlRe.test(str)) {
        return 1;
    }
    if (cssUrlReWithQuote.test(str)) {
        return 2;
    }
    return 0;
}

export function extractCssUrl(str) {
    const test = isCssUrl(str);
    let matches;
    if (test === 3) {
        return str;
    }
    if (test === 1) {
        matches = cssUrlRe.exec(str);
        return matches[1];
    } else if (test === 2) {
        matches = cssUrlReWithQuote.exec(str);
        return matches[2];
    } else {
        // return as is if not an css url
        return str;
    }
}

const b64chrs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

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
/* istanbul ignore next */
export function btoa(input) {
    if ((typeof window !== 'undefined') && window.btoa) {
        return window.btoa(input);
    }
    const str = String(input);
    let output = '';
    for (
        // initialize result and counter
        let block, charCode, idx = 0, map = b64chrs;
        // if the next str index does not exist:
        //   change the mapping table to "="
        //   check if d has no fractional digits
        str.charAt(idx | 0) || (map = '=', idx % 1);
        // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
        output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
        charCode = str.charCodeAt(idx += 3 / 4);
        if (charCode > 0xFF) {
            throw new Error('\'btoa\' failed: The string to be encoded contains characters outside of the Latin1 range.');
        }
        block = block << 8 | charCode;
    }
    return output;
}

export function b64toBlob(b64Data, contentType) {
    const byteCharacters = atob(b64Data);
    const arraybuffer = new ArrayBuffer(byteCharacters.length);
    const view = new Uint8Array(arraybuffer);
    for (let i = 0; i < byteCharacters.length; i++) {
        view[i] = byteCharacters.charCodeAt(i) & 0xff;
    }
    const blob = new Blob([arraybuffer], { type: contentType });
    return blob;
}

/**
 * Compute degree bewteen 2 points.
 * @param  {Point} p1 point 1
 * @param  {Point} p2 point 2
 * @return {Number}    degree between 2 points
 * @memberOf Util
 */
export function computeDegree(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.atan2(dy, dx);
}

/**
 * Transparent 1X1 gif image
 * from https://css-tricks.com/snippets/html/base64-encode-of-1x1px-transparent-gif/
 * @type {String}
 * @memberOf Util
 */
export const emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';


/**
 * shallow equal
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Boolean}
 * @private
 * @memberOf Util
 */
export function equalMapView(obj1, obj2) {
    if (!obj1 && !obj2) {
        return true;
    } else if (!obj1 || !obj2) {
        return false;
    }
    for (const p in obj1) {
        if (p === 'center') {
            if (!obj2[p] || !approx(obj1[p][0], obj2[p][0]) || !approx(obj1[p][1], obj2[p][1])) {
                return false;
            }
        } else if (obj1[p] !== obj2[p]) {
            return false;
        }
    }
    return true;
}

function approx(val, expected, delta) {
    if (delta == null) { delta = 1e-6; }
    return val >= expected - delta && val <= expected + delta;
}

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
export function flash(interval, count, cb, context) {
    if (!interval) {
        interval = 100;
    }
    if (!count) {
        count = 4;
    }
    const me = this;
    count *= 2;
    if (this._flashTimeout) {
        clearTimeout(this._flashTimeout);
    }

    function flashGeo() {
        if (count === 0) {
            me.show();
            if (cb) {
                if (context) {
                    cb.call(context);
                } else {
                    cb();
                }
            }
            return;
        }

        if (count % 2 === 0) {
            me.hide();
        } else {
            me.show();
        }
        count--;
        me._flashTimeout = setTimeout(flashGeo, interval);
    }
    this._flashTimeout = setTimeout(flashGeo, interval);
    return this;
}

export function _defaults(obj, defaults) {
    const keys = Object.getOwnPropertyNames(defaults);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = Object.getOwnPropertyDescriptor(defaults, key);
        if (value && value.configurable && obj[key] === undefined) {
            Object.defineProperty(obj, key, value);
        }
    }
    return obj;
}
