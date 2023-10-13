import Color from 'color';
export function isNil(v) {
    return v === undefined || v === null;
}

export function extend(dest) { // (Object[, Object, ...]) ->
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}

export function isFunction(obj) {
    if (obj === null || obj === undefined) {
        return false;
    }
    return typeof obj === 'function' || (obj.constructor !== null && obj.constructor === Function);
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
 * Whether val is a number and not a NaN.
 * @param  {Object}  val - val
 * @return {Boolean}
 * @memberOf Util
 */
export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}

export function toRadian(d) {
    return d * Math.PI / 180;
}

export function toDegree(d) {
    return d / Math.PI * 180;
}

export function getAbsoluteURL(url) {
    let a = document.createElement('a');
    a.href = url;
    url = a.href;
    a = null;
    return url;
}

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

const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];

export function stringFromUTF8Array(data) {
    const count = data.length;
    let str = '';

    for (let index = 0; index < count;) {
        let ch = data[index++];
        if (ch & 0x80) {
            let extra = extraByteMap[(ch >> 3) & 0x07];
            if (!(ch & 0x40) || !extra || ((index + extra) > count))
                return null;

            ch = ch & (0x3F >> extra);
            for (;extra > 0; extra -= 1) {
                const chx = data[index++];
                if ((chx & 0xC0) !== 0x80)
                    return null;

                ch = (ch << 6) | (chx & 0x3F);
            }
        }

        str += String.fromCharCode(ch);
    }
    return str;
}

// 给 Matrix3 指定某列设置数据
export function setColumn3(out, arr, col) {
    out[3 * col] = arr[0];
    out[3 * col + 1] = arr[1];
    out[3 * col + 2] = arr[2];
    return out;
}

export function flatArr(arr) {
    if (arr.flat) {
        return arr.flat(Infinity);
    } else {
        return arr.reduce((acc, val) => acc.concat(val), []);
    }
}

export function getBatchIdArrayType(max) {
    if (max < 256) return Uint8Array;
    if (max < 65536) return Uint16Array;
    return Uint32Array;
}

// const base64Matcher = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function isBase64(url) {
    return url.indexOf('data:') === 0;
}

export function base64URLToArrayBuffer(url) {
    const firstDot = url.indexOf('base64,');
    const base64 = url.substring(firstDot + 7);
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
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

const colorCache = {};
export function normalizeColor(out, color) {
    if (!Array.isArray(color)) {
        const key = color;
        color = colorCache[key] = colorCache[key] || Color(color).array().map(v => { return v / 255; });
    }
    for (let i = 0; i < color.length; i++) {
        out[i] = color[i];
    }
    if (color.length === 3) {
        out[3] = 1;
    }
    return out;
}
