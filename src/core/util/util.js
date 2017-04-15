import { isNode } from './env';
import { isString, isNil, hasOwn } from './common';

// RequestAnimationFrame, inspired by Leaflet
let requestAnimFrame, cancelAnimFrame;
(function () {
    if (isNode) {
        requestAnimFrame = function (fn) {
            return setTimeout(fn, 16);
        };

        cancelAnimFrame = clearTimeout;
        return;
    }

    let requestFn, cancelFn;
    let lastTime = 0;

    // fallback for IE 7-8
    function timeoutDefer(fn) {
        const time = +new Date(),
            timeToCall = Math.max(0, 16 - (time - lastTime));

        lastTime = time + timeToCall;
        return setTimeout(fn, timeToCall);
    }

    function getPrefixed(name) {
        return window['webkit' + name] || window['moz' + name] || window['ms' + name];
    }
    if (typeof (window) != 'undefined') {
        // inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

        requestFn = window['requestAnimationFrame'] || getPrefixed('RequestAnimationFrame') || timeoutDefer;
        cancelFn = window['cancelAnimationFrame'] || getPrefixed('CancelAnimationFrame') ||
            getPrefixed('CancelRequestAnimationFrame') || function (id) {
                window.clearTimeout(id);
            };
    } else {
        requestFn = timeoutDefer;
        cancelFn = function (id) {
            clearTimeout(id);
        };
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

/**
 * Merges options with the default options of the object.
 * @param {Object} obj      - object
 * @param {Object} options  - options
 * @returns {Object} options
 * @memberOf Util
 */
export function setOptions(obj, options) {
    if (hasOwn(obj, 'options')) {
        obj.options = obj.options ? Object.create(obj.options) : {};
    }
    for (const i in options) {
        obj.options[i] = options[i];
    }
    return obj.options;
}

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
    if (isNode && loadImage.node) {
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

export function executeWhen(fn, when) {
    const exe = function () {
        if (when()) {
            fn();
        } else {
            requestAnimFrame(exe);
        }
    };

    exe();
}

export function removeFromArray(obj, array) {
    const i = array.indexOf(obj);
    if (i > -1) {
        array.splice(i, 1);
    }
}

export function mapArrayRecursively(arr, fn, context) {
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
            result.push(mapArrayRecursively(p, fn, context));
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

/*
 * Caculate round of a number, more efficient.
 * @param  {Number} num - num to round
 * @return {Number}
 * @memberOf Util
 */
export function round(num) {
    if (num > 0) {
        return (0.5 + num) << 0;
    } else {
        return (num - 0.5) << 0;
    }
}

/**
 * Polyfill for Math.sign
 * @param  {Number} x
 * @return {Number}
 * @memberOf Util
 */
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
 * constrain n to the given range, excluding the minimum, via modular arithmetic
 * @param {Number} n value
 * @param {Number} min the minimum value to be returned, exclusive
 * @param {Number} max the maximum value to be returned, inclusive
 * @returns {Number} constrained number
 * @private
 */
export function wrap(n, min, max) {
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return (w === min) ? max : w;
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
const cssUrlReWithQuote = /^url\(([\'\"])(.+)\1\)$/i;

const cssUrlRe = /^url\(([^\'\"].*[^\'\"])\)$/i;

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

/**
 * Compute degree bewteen 2 points.
 * @param  {Point} p1 point 1
 * @param  {Point} p2 point 2
 * @return {Number}    degree between 2 points
 * @memberOf Util
 */
export function computeDegree(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.atan2(dy, dx);
}
