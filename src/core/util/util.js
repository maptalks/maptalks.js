/**
 * Misc utilities used internally
 * @class
 * @category core
 * @protected
 */

import { isNode } from './env';
import { create, isArray, isString, isNil, hasOwn } from './common';

import { readFile } from 'fs';
import { parse } from 'url';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';

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

    var requestFn, cancelFn;
    var lastTime = 0;

    // fallback for IE 7-8
    function timeoutDefer(fn) {
        var time = +new Date(),
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
    requestAnimFrame = function (fn) {
        return requestFn(fn);
    };

    cancelAnimFrame = function (id) {
        if (id) {
            cancelFn(id);
        }
    };
})();
export { requestAnimFrame, cancelAnimFrame };

/**
 * @property {Number} uid
 * @static
 */
let uid = 0;

/**
 * Set options to a object, extends its options member.
 * @param {Object} obj      - object to set options to
 * @param {Object} options  - options to set
 * @returns {Object} options set
 */
export function setOptions(obj, options) {
    if (hasOwn(obj, 'options')) {
        obj.options = obj.options ? create(obj.options) : {};
    }
    for (var i in options) {
        obj.options[i] = options[i];
    }
    return obj.options;
}

export function isSVG(url) {
    var prefix = 'data:image/svg+xml';
    if (url.length > 4 && url.slice(-4) === '.svg') {
        return 1;
    } else if (url.slice(0, prefix.length) === prefix) {
        return 2;
    }
    return 0;
}

export const noop = function () {};

// TODO: convertSVG???
export let convertSVG = noop;

let _loadRemoteImage = noop;
let _loadLocalImage = noop;

if (isNode) {
    _loadRemoteImage = function (img, url, onComplete) {
        // http
        var request;
        if (url.indexOf('https://') === 0) {
            request = httpsRequest;
        } else {
            request = httpRequest;
        }
        var urlObj = parse(url);
        //mimic the browser to prevent server blocking.
        urlObj.headers = {
            'Accept': 'image/*,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Host': urlObj.host,
            'Pragma': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
        };
        request(urlObj, function (res) {
            var data = [];
            res.on('data', function (chunk) {
                data.push(chunk);
            });
            res.on('end', function () {
                onComplete(null, Buffer.concat(data));
            });
        }).on('error', onComplete).end();
    };

    _loadLocalImage = function (img, url, onComplete) {
        // local file
        readFile(url, onComplete);
    };
}

/**
 * Load a image, can be a remote one or a local file. <br>
 * If in node, a SVG image will be converted to a png file by [svg2img]{@link https://github.com/FuZhenn/node-svg2img}<br>
 * @param  {Image} img  - the image object to load.
 * @param  {Object[]} imgDesc - image's descriptor, it's a array. imgUrl[0] is the url string, imgUrl[1] is the width, imgUrl[2] is the height.
 */
export function loadImage(img, imgDesc) {
    if (!isNode) {
        img.src = imgDesc[0];
        return;
    }

    function onError(err) {
        if (err) {
            console.error(err);
            console.error(err.stack);
        }
        var onerrorFn = img.onerror;
        if (onerrorFn) {
            onerrorFn.call(img);
        }
    }

    function onLoadComplete(err, data) {
        if (err) {
            onError(err);
            return;
        }
        var onloadFn = img.onload;
        if (onloadFn) {
            img.onload = function () {
                onloadFn.call(img);
            };
        }
        img.src = data;
    }
    var url = imgDesc[0],
        w = imgDesc[1],
        h = imgDesc[2];
    try {
        if (isSVG(url) && convertSVG) {
            convertSVG(url, w, h, onLoadComplete);
        } else if (isURL(url)) {
            // canvas-node的Image对象
            _loadRemoteImage(img, url, onLoadComplete);
        } else {
            _loadLocalImage(img, url, onLoadComplete);
        }
    } catch (error) {
        onError(error);
    }
}

/**
 * Generate a global UID, not a real UUID, just a auto increment key with a prefix.
 * @return {Number}
 */
export function UID() {
    return uid++;
}
export const GUID = UID;

/**
 * Parse a JSON string to a object
 * @param {String} str      - a JSON string
 * @return {Object}
 */
export function parseJSON(str) {
    if (!str || !isString(str)) {
        return str;
    }
    return JSON.parse(str);
}

export function executeWhen(fn, when) {
    var exe = function () {
        if (when()) {
            fn();
        } else {
            requestAnimFrame(exe);
        }
    };

    exe();
}

export function removeFromArray(obj, array) {
    for (var i = array.length - 1; i >= 0; i--) {
        if (array[i] === obj) {
            return array.splice(i, 1);
        }
    }
    return null;
}

export function mapArrayRecursively(arr, fn, context) {
    if (!isArray(arr)) {
        return null;
    }
    var result = [],
        p, pp;
    for (var i = 0, len = arr.length; i < len; i++) {
        p = arr[i];
        if (isNil(p)) {
            result.push(null);
            continue;
        }
        if (isArray(p)) {
            result.push(mapArrayRecursively(p, fn, context));
        } else {
            pp = context ? fn.call(context, p) : fn(p);
            result.push(pp);
        }

    }
    return result;
}

export function mapArray(array, fn, context) {
    if (!isArray(array)) {
        return null;
    }
    var result = [],
        p, pp;
    for (var i = 0, len = array.length; i < len; i++) {
        p = array[i];
        if (isNil(p)) {
            result.push(null);
            continue;
        }
        pp = context ? fn.call(context, p) : fn(p);
        result.push(pp);
    }
    return result;
}

export function indexOfArray(obj, arr) {
    if (!isArrayHasData(arr)) {
        return -1;
    }
    for (var i = 0, len = arr.length; i < len; i++) {
        if (arr[i] === obj) {
            return i;
        }
    }
    return -1;
}

export function getValueOrDefault(v, d) {
    return v === undefined ? d : v;
}

/**
 * Shallow comparison of two objects <br>
 * borrowed from expect.js
 * @param  {Object} a
 * @param  {Object} b
 * @return {Boolean}
 */
export function objEqual(a, b) {
    return _objEqual(a, b);
}

/**
 * Deep comparison of two objects <br>
 * borrowed from expect.js
 * @param  {Object} a
 * @param  {Object} b
 * @return {Boolean}
 */
export function objDeepEqual(a, b) {
    return _objEqual(a, b, true);
}

function _objEqual(a, b, isDeep) {
    function getKeys(obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var i in obj) {
            if (hasOwn(obj, i)) {
                keys.push(i);
            }
        }
        return keys;
    }
    if (isNil(a) || isNil(b)) {
        return false;
    }
    // an identical "prototype" property.
    if (a.prototype !== b.prototype) {
        return false;
    }
    var ka, kb, key, i;
    try {
        ka = getKeys(a);
        kb = getKeys(b);
    } catch (e) { //happens when one is a string literal and the other isn't
        return false;
    }
    // having the same number of owned properties (keys incorporates hasOwnProperty)
    if (ka.length !== kb.length) {
        return false;
    }
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] !== kb[i]) {
            return false;
        }
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    if (isDeep) {
        for (i = ka.length - 1; i >= 0; i--) {
            key = ka[i];
            if (!objEqual(a[key], b[key])) {
                return false;
            }
        }
    }
    return true;
}

/*
 * round a number, more efficient one.
 * @param  {Number} num - num to round
 * @return {Number}
 */
export function round(num) {
    if (num > 0) {
        return (0.5 + num) << 0;
    } else {
        return (num - 0.5) << 0;
    }
}


/*
 * 判断数组中是否包含obj
 * @param {Object} obj
 * @return {Boolean} true|false
 */
export function isArrayHasData(obj) {
    return isArray(obj) && obj.length > 0;
}

/**
 * Whether the input string is a valid url.
 * @param  {String}  url - url to check
 * @return {Boolean}
 */
export function isURL(url) {
    if (!url) {
        return false;
    }
    var head = url.slice(0, 6);
    if (head === 'http:/' || head === 'https:') {
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
    var head = str.slice(0, 6);
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
    var test = isCssUrl(str),
        matches;
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
 * @example
 *     var encodedData = Util.btoa(stringToEncode);
 */
export function btoa(input) {
    if ((typeof window !== 'undefined') && window.btoa) {
        return window.btoa(input);
    }
    var str = String(input);
    for (
        // initialize result and counter
        var block, charCode, idx = 0, map = b64chrs, output = '';
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
 * Borrowed from jquery, evaluates a javascript snippet in a global context
 * @param {String} code
 */
export function globalEval(code) {
    var script = document.createElement('script');
    script.text = code;
    document.head.appendChild(script).parentNode.removeChild(script);
}

/**
 * Borrowed from jquery, evaluates a script in a global context.
 * @param  {String} file    - javascript file to eval
 */
export function globalScript(file) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = file;
    document.head.appendChild(script);
}

export function computeDegree(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    return Math.atan2(dy, dx);
}
