import { isFunctionDefinition, interpolated } from '@maptalks/function-type';
import Color from 'color';

export function now() {
    return Date.now();
}

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
export function extend(dest) { // (Object[, Object, ...]) ->
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
}

/**
 * Whether the object is null or undefined.
 * @param  {Object}  obj - object
 * @return {Boolean}
 * @memberOf Util
 */
export function isNil(obj) {
    return obj == null;
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

/**
 * Whether a number is an integer
 * @param  {Number}  n
 * @return {Boolean}
 * @memberOf Util
 */
export function isInteger(n) {
    return (n | 0) === n;
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
 * Check whether the object is a string
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
export function isString(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'string' || (obj.constructor !== null && obj.constructor === String);
}

/**
 * Check whether the object is a function
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
export function isFunction(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'function' || (obj.constructor !== null && obj.constructor === Function);
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * Check whether the object owns the property.
 * @param  {Object}  obj - object
 * @param  {String}  key - property
 * @return {Boolean}
 * @memberOf Util
 */
export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
}

/**
 * Join an array, standard or a typed one.
 * @param  {Object[]} arr       array to join
 * @param  {String} seperator  seperator
 * @return {String}           result string
 * @private
 * @memberOf Util
 */
export function join(arr, seperator) {
    if (arr.join) {
        return arr.join(seperator || ',');
    } else {
        return Array.prototype.join.call(arr, seperator || ',');
    }
}

const pi = Math.PI / 180;

export function toRadian(d) {
    return d * pi;
}

export function toDegree(r) {
    return r / pi;
}

export function evaluate(prop, properties, zoom) {
    if (isFunction(prop)) {
        if (zoom !== undefined) {
            return prop(zoom, properties);
        } else {
            return prop(null, properties);
        }
    } else {
        return prop;
    }
}

export function isFnTypeSymbol(v) {
    return v && isFunctionDefinition(v) && v.property;
}

export function getAltitudeToLocal(options) {
    const { verticalCentimeterToPoint, tileRatio } = options;
    const altitudeToLocal = verticalCentimeterToPoint * tileRatio;
    return altitudeToLocal;
}

export function getTubeSizeScale(metric) {
    if (metric === 'centimeter' || metric === 'cm') {
        return 1;
    } else if (metric === 'millimeter' || metric === 'mm') {
        return 0.1;
    } else {
        return 100;
    }
}

const colorCache = {};

export function normalizeColor(out, color) {
    if (!Array.isArray(color)) {
        if (color && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            // a object containing r, g, b, a
            out[0] = color.r * 255;
            out[1] = color.g * 255;
            out[2] = color.b * 255;
            if (color.a !== undefined) {
                out[3] = color.a * 255;
            } else {
                out[3] = 255;
            }
            return out;
        }
        const key = color;
        color = colorCache[key] = colorCache[key] || Color(color).unitArray();
    }
    for (let i = 0; i < color.length; i++) {
        out[i] = color[i] * 255;
    }
    if (color.length === 3) {
        out[3] = 255;
    }
    return out;
}

const SYMBOLS_SUPPORT_IDENTITY_FN_TYPE = {
    'textFill': 1,
    'textSize': 1,
    'textOpacity': 1,
    'textDx': 1,
    'textDy': 1,
    'markerWidth': 1,
    'markerHeight': 1,
    'markerOpacity': 1,
    'markerDx': 1,
    'markerDy': 1,
    'lineWidth': 1,
    'lineColor': 1,
    'lineOpacity': 1,
    'polygonFill': 1,
    'polygonOpacity': 1,
    'polygonPatternFileWidth': 1,
    'polygonPatternFileOrigin': 1,
    'rotationX': 1,
    'rotationY': 1,
    'rotationZ': 1,
    'scaleX': 1,
    'scaleY': 1,
    'scaleZ': 1,
    'translationX': 1,
    'translationY': 1,
    'translationZ': 1
};

// 遍历features，检查 symbolName 对应的属性中，是否有fn-type类型的值，而且和zoom相关
export function checkIfIdentityZoomDependent(symbolName, prop, features) {
    if (!Array.isArray(features)) {
        features = Object.values(features);
    }
    if (!features || !features.length) {
        return false;
    }
    if (!SYMBOLS_SUPPORT_IDENTITY_FN_TYPE[symbolName]) {
        return false;
    }
    for (let i = 0; i < features.length; i++) {
        const fea = features[i] && (features[i].feature || features[i]);
        if (!fea) {
            continue;
        }
        const v = fea.properties && fea.properties[prop];
        if (!v) {
            continue;
        }
        if (isFunctionDefinition(v) && !interpolated(v).isZoomConstant) {
            return true;
        }
    }
    return false;
}

const SYMBOLS_NEEDS_CHECK = {
    // textName如果是property，传到painter来计算textFit
    'textName': 1,
    // 以下两个属性如果和property有关，需要传到painter来计算textFit
    'markerTextFitPadding': 1,
    'markerTextFit': 1,
    // 需要把这个property传给painter来生成gradient
    'lineGradientProperty': 1
}

export function checkIfZoomFnTypeSymbol(symbolName) {
    return !!SYMBOLS_SUPPORT_IDENTITY_FN_TYPE[symbolName] || !!SYMBOLS_NEEDS_CHECK[symbolName];
}
