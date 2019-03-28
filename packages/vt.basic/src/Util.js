import * as maptalks from 'maptalks';

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
