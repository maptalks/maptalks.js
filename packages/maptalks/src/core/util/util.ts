/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/ban-types */
import { IS_NODE } from './env';
import Browser from '../Browser';
import { isString, isNil } from './common';
import Point from '../../geo/Point';

let requestAnimFrame: any, cancelAnimFrame: any;
/* istanbul ignore next */
(function () {
    if (IS_NODE) {
        requestAnimFrame = function (fn) {
            return setTimeout(fn, 16);
        };
        cancelAnimFrame = clearTimeout;
        return;
    }

    requestAnimFrame = requestAnimationFrame;
    cancelAnimFrame = cancelAnimationFrame;
})();
export { requestAnimFrame, cancelAnimFrame };

export function isSVG(url: string) {
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
 * @param img  - the image object to load.
 * @param imgDesc - image's descriptor, it's an array. imgUrl[0] is the url string, imgUrl[1] is the width, imgUrl[2] is the height.
 * @private
 * @memberOf Util
 */
export function loadImage(img: any, imgDesc: Object[]) {
    /* istanbul ignore next */
    // @ts-expect-error
    if (IS_NODE && loadImage.node) {
        // @ts-expect-error
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
 * @param str   - a JSON string
 * @return
 * @memberOf Util
 */
export function parseJSON(str: string) {
    if (!str || !isString(str)) {
        return str;
    }
    return JSON.parse(str);
}

export function pushIn<T extends Array<any>>(...args: T[]) {
    const dest = args[0]
    for (let i = 1; i < args.length; i++) {
        const src = args[i];
        if (src && src.length) {
            for (let ii = 0, ll = src.length; ii < ll; ii++) {
                dest.push(src[ii]);
            }
        }
    }
    return dest.length;
}


export function mergeArray<T extends Array<any>>(...args: T[]) {
    const dest = [];
    let idx = -1;
    for (let i = 0; i < args.length; i++) {
        const src = args[i];
        if (src && src.length) {
            for (let ii = 0, ll = src.length; ii < ll; ii++) {
                dest[++idx] = src[ii];
            }
        }
    }
    return dest;
}

export function removeFromArray<T>(obj: T, array: T[]) {
    const i = array.indexOf(obj);
    if (i > -1) {
        array.splice(i, 1);
    }
}

export function forEachCoord(arr: any[], fn: Function, context?: any) {
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

export function getValueOrDefault<T>(v: T, d: T) {
    return v === undefined ? d : v;
}

/**
 * Polyfill for Math.sign
 * @param  x
 * @return
 * @memberOf Util
 */
/* istanbul ignore next */
export function sign(x: number) {
    if (Math.sign) {
        return Math.sign(x);
    }
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return Number(x);
    }
    return x > 0 ? 1 : -1;
}

export function log2(x: number) {
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

/**
 * Interpolate between two number.
 *
 * @param from
 * @param to
 * @param t interpolation factor between 0 and 1
 * @returns interpolated color
 */
export function interpolate(a: number, b: number, t: number) {
    return (a * (1 - t)) + (b * t);
}

/**
 * constrain n to the given range, via modular arithmetic
 * @param n value
 * @param min the minimum value to be returned, inclusive
 * @param max the maximum value to be returned, inclusive
 * @returns constrained number
 * @private
 */
export function wrap(n: number, min: number, max: number) {
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
 * @param n value
 * @param min the minimum value to be returned
 * @param max the maximum value to be returned
 * @returns the clamped value
 * @private
 */
export function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

/**
 * Is object an array and not empty.
 * @param obj
 * @return true|false
 * @private
 * @memberOf Util
 */
export function isArrayHasData(obj: Object): boolean {
    return Array.isArray(obj) && obj.length > 0;
}


const urlPattern = /^([a-z][a-z\d+\-.]*:)?\/\//i;
/**
 * Whether the input string is a valid url.
 * form: https://github.com/axios/axios/blob/master/lib/helpers/isAbsoluteURL.js
 * @param url - url to check
 * @return
 * @memberOf Util
 * @private
 */
export function isURL(url: string) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    // eslint-disable-next-line no-useless-escape
    return urlPattern.test(url);
}

//改原先的regex名字为xWithQuote；不带引号的regex，/^url\(([^\'\"].*[^\'\"])\)$/i，为xWithoutQuote。然后在is函数里||测试，extract函数里if...else处理。没引号的匹配后，取matches[1]

// match: url('x'), url("x").
// TODO: url(x)
const cssUrlReWithQuote = /^url\((['"])(.+)\1\)$/i;

const cssUrlRe = /^url\(([^'"].*[^'"])\)$/i;

export function isCssUrl(str: string) {
    if (!isString(str)) {
        return 0;
    }
    if (cssUrlRe.test(str)) {
        return 1;
    }
    if (cssUrlReWithQuote.test(str)) {
        return 2;
    }
    return 3;
}

export function extractCssUrl(str: string) {
    const test = isCssUrl(str);
    let matches;
    if (test === 3) {
        return str;
    } else if (test === 1) {
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
 * @param input - input string to convert
 * @return ascii
 * @memberOf Util
 * @example
 *     const encodedData = Util.btoa(stringToEncode);
 */
/* istanbul ignore next */
/* eslint-disable no-sequences */
export function btoa(input: string) {
    if (Browser.btoa) {
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
/* eslint-enable no-sequences */
export function b64toBlob(b64Data: string, contentType: string) {
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
 * @param  x0
 * @param  y0
 * @param  x1
 * @param  y1
 * @return    degree between 2 points
 * @memberOf Util
 */
export function computeDegree(x0: number, y0: number, x1: number, y1: number) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.atan2(dy, dx);
}

/**
 * Transparent 1X1 gif image
 * from https://css-tricks.com/snippets/html/base64-encode-of-1x1px-transparent-gif/
 * @memberOf Util
 */
export const emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';


/**
 * shallow equal
 * @param  obj1
 * @param  obj2
 * @return
 * @private
 * @memberOf Util
 */
export function equalMapView(obj1: Object, obj2: Object) {
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

function approx(val: number, expected: number, delta?: number) {
    if (delta == null) { delta = 1e-6; }
    return val >= expected - delta && val <= expected + delta;
}

/**
 * Flash something, show and hide by certain internal for times of count.
 *
 * @param interval   - interval of flash, in millisecond (ms)
 * @param count      - flash times
 * @param cb         - callback function when flash ended
 * @param context    - callback context
 * @return this
 * @private
 * @memberOf Util
 */
export function flash(interval: number = 100, count: number = 4, cb: Function = null, context: any = null) {
    if (!interval) {
        interval = 100;
    }
    if (!count) {
        count = 4;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const me = this;
    const initVisible = this.isVisible();
    count *= 2;
    if (this._flashTimeout) {
        clearTimeout(this._flashTimeout);
    }

    function flashGeo() {
        if (count === 0) {
            if (initVisible) {
                me.show();
            } else {
                me.hide();
            }
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

export function _defaults(obj: any, defaults: any) {
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

export function getPointsResultPts(points: any[] = [], ptKey = '_pt') {
    const resultPoints = [];
    for (let i = 0, len = points.length; i < len; i++) {
        const point = points[i];
        if (!point) {
            resultPoints.push(null);
            continue;
        }
        if (!point[ptKey]) {
            point[ptKey] = new Point(0, 0);
        }
        const pt = point[ptKey];
        pt.x = 0;
        pt.y = 0;
        resultPoints.push(pt);
    }
    return resultPoints;
}


// let BITMAP_CTX;
// if (Browser.decodeImageInWorker) {
//     const canvas = document.createElement('canvas');
//     canvas.width = 1;
//     canvas.height = 1;
//     BITMAP_CTX = canvas.getContext('2d');
// }
export function getImageBitMap<T>(data: { data: T }, cb: (d: T) => void | any) {
    cb(data.data);
    // const imageData = BITMAP_CTX.createImageData(data.width, data.height);
    // imageData.data.set(data.data);
    // createImageBitmap(imageData).then(bitmap => {
    //     cb(bitmap);
    // });
}

export function getAbsoluteURL(url: string) {
    if (url && url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
        return url;
    }
    let a = document.createElement('a');
    a.href = url;
    url = a.href;
    a = null;
    return url;
}

const CANVAS_SIZE_TEMP = {
    cssWidth: '1px',
    cssHeight: '1px',
    width: 1,
    height: 1
};

export function calCanvasSize(size: { width: number, height: number }, devicePixelRatio = 1) {
    const { width, height } = size;
    CANVAS_SIZE_TEMP.cssWidth = width + 'px';
    CANVAS_SIZE_TEMP.cssHeight = height + 'px';
    CANVAS_SIZE_TEMP.width = Math.round(width * devicePixelRatio);
    CANVAS_SIZE_TEMP.height = Math.round(height * devicePixelRatio);
    return CANVAS_SIZE_TEMP;
}

export function isNoContentHttpCode(code: number) {
    // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
    // 501 Not Implemented
    return code === 204 || code >= 400 && code < 500 || code === 501;
}
