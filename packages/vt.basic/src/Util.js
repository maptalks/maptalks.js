import * as maptalks from 'maptalks';
import Color from 'color';

/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 */
export function extend(dest) { // (Object[, Object, ...]) ->
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}


export function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

export function isNil(obj) {
    return obj === null || obj === undefined;
}

export function evaluate(prop, properties, zoom) {
    if (maptalks.Util.isFunction(prop)) {
        if (zoom !== undefined) {
            return prop(zoom, properties);
        } else {
            return prop(null, properties);
        }
    } else {
        return prop;
    }
}

export const TYPE_BYTES = {
    'int8': 1,
    'int16': 2,
    'int32': 4,
    'uint8': 1,
    'uint16': 2,
    'uint32': 4,
    'float': 4,
    'float32': 4
};


export function setUniformFromSymbol(uniforms, name, symbol, key, fn) {
    if (isNil(symbol[key])) {
        return;
    }
    if (symbol['_' + key]) {
        // a function type
        Object.defineProperty(uniforms, name, {
            enumerable: true,
            get: function () {
                return fn ? fn(symbol[key]) : symbol[key];
            }
        });
    } else {
        uniforms[name] = fn ? fn(symbol[key]) : symbol[key];
    }
}

export function createColorSetter(cache) {
    return _colorSetter.bind(this, cache);
}

function _colorSetter(cache, c) {
    if (Array.isArray(c)) {
        if (c.length === 3) {
            c.push(1);
        }
        return c;
    }
    if (cache && cache[c]) {
        return cache[c];
    }
    const color = Color(c).unitArray();
    if (color.length === 3) {
        color.push(1);
    }
    if (cache) cache[c] = color;
    return color;
}

export function fillArray(arr, value, start, end) {
    if (arr.fill) {
        arr.fill(value, start, end);
    } else {
        for (let i = start; i < end; i++) {
            arr[i] = value;
        }
    }
}
