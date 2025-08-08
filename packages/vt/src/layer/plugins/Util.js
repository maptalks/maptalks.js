import * as maptalks from 'maptalks';
import { isFunctionDefinition } from '@maptalks/function-type';
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

export function wrap(n, min, max) {
    if (n === max || n === min) {
        return n;
    }
    const d = max - min;
    const w = ((n - min) % d + d) % d + min;
    return w;
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

export function copyJSON(json) {
    const copied = JSON.parse(JSON.stringify(json));
    if (Array.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
            if (!copied[i]) {
                continue;
            }
            const { symbol } = copied[i];
            if (!symbol) {
                continue;
            }
            const oldSymbol = json[i].symbol;
            for (const p in oldSymbol) {
                if (!symbol[p]) {
                    symbol[p] = oldSymbol[p];
                }
            }
        }
    } else {
        if (json.style) {
            const copiedStyle = copyJSON(json.style);
            copied.style = copiedStyle;
            return copied;
        }
        if (json.symbol) {
            const copiedSymbol = copyJSON(json.symbol);
            copied.symbol = copiedSymbol;
            return copied;
        }
        // symbol itself
        for (const p in json) {
            if (!copied[p]) {
                copied[p] = json[p];
            }
        }
    }
    return copied;
}

export function setUniformFromSymbol(uniforms, name, symbol, key, defaultValue, fn) {
    // if (symbol['_' + key]) {
    //     // a function type
    //     Object.defineProperty(uniforms, name, {
    //         enumerable: true,
    //         get: function () {
    //             return fn ? fn(symbol[key]) : symbol[key];
    //         }
    //     });
    // } else {
    //     uniforms[name] = fn ? fn(symbol[key]) : symbol[key];
    // }
    if (name in uniforms) {
        return;
    }
    Object.defineProperty(uniforms, name, {
        enumerable: true,
        get: function () {
            const v = (isNil(symbol[key]) || isFunctionDefinition(symbol[key])) ? defaultValue : symbol[key];
            return fn ? fn(v) : v;
        }
    });
}

const ARR0 = [];
// 结果存储在一个全局临时数组中，
export function toUint8ColorInGlobalVar(color) {
    for (let i = 0; i < color.length; i++) {
        ARR0[i] = color[i];
        ARR0[i] *= 255;
    }
    if (color.length === 3) {
        ARR0[3] = 255;
    }
    return ARR0;
}

export function createColorSetter(cache, size = 4) {
    return _colorSetter.bind(this, cache, size);
}

function _colorSetter(cache, size, c) {
    if (Array.isArray(c)) {
        if (c.length === 3 && size === 4) {
            c.push(1);
        }
        return c;
    }
    if (cache && cache[c]) {
        return cache[c];
    }
    if (c.r !== undefined && c.g !== undefined && c.b !== undefined && c.a !== undefined) {
        const color = [c.r, c.g, c.b, c.a];
        return color;
    }
    const color = Color(c).unitArray();
    if (color.length === 3 && size === 4) {
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

/**
 * Whether val is a number and not a NaN.
 * @param  {Object}  val - val
 * @return {Boolean}
 * @memberOf Util
 */
export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}

export function isIconText(symbolDef) {
    return symbolDef && (symbolDef.markerFile || symbolDef.markerType) && symbolDef.textName !== undefined;
}

export function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function getUniqueIds(ids, isReverse) {
    if (isReverse) {
        let current = ids[ids.length - 1];
        const result = [current];
        // 倒序是因为后面的图形，碰撞时优先级更高， maptalks/issues#626
        for (let i = ids.length - 2; i >= 0; i--) {
            if (ids[i] !== current) {
                result.push(ids[i]);
                current = ids[i];
            }
        }
        return result;
    } else {
        let current = ids[ids[0]];
        const result = [current];
        // 倒序是因为后面的图形，碰撞时优先级更高， maptalks/issues#626
        for (let i = 1; i < ids.length; i++) {
            if (ids[i] !== current) {
                result.push(ids[i]);
                current = ids[i];
            }
        }
        return result;
    }
}

export function isArray(arr) {
    return Array.isArray(arr) ||
    arr.constructor === Float32Array ||
    arr.constructor === Float64Array ||
    arr.constructor === Uint8Array ||
    arr.constructor === Int8Array ||
    arr.constructor === Uint16Array ||
    arr.constructor === Int16Array ||
    arr.constructor === Uint32Array ||
    arr.constructor === Int32Array ||
    arr.constructor === Uint8ClampedArray;
}

const COORD1 = new maptalks.Coordinate(0, 0);
export function meterToPoint(map, meter, patternOrigin, res, isYAxis) {
    const point = map.distanceToPointAtRes(meter, meter, res, patternOrigin, COORD1);
    return isYAxis ? point.y : point.x;
}

export function pointAtResToMeter(map, pointDistance, patternOrigin, res, isYAxis) {
    const distance = map.pointAtResToDistance(isYAxis ? 0 : pointDistance, isYAxis ? pointDistance : 0, res, patternOrigin);
    return distance;
}
