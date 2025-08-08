const supportAssign = typeof Object.assign === 'function';
import { vec3, mat4 } from '@maptalks/reshader.gl';
import Color from 'color';
import { Coordinate } from 'maptalks';

/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 */
const TEMP_VEC = [];
export function extend(dest) {
    if (supportAssign) {
        Object.assign.apply(Object, arguments);
    } else {
        for (let i = 1; i < arguments.length; i++) {
            const src = arguments[i];
            for (const k in src) {
                dest[k] = src[k];
            }
        }
    }
    return dest;
}

export function isNil(v) {
    return v === undefined || v === null;
}

export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
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

const SCALE = [];
export function getGroundTransform(out, map) {
    const extent = map['_get2DExtentAtRes'](map.getGLRes());
    const scaleX = extent.getWidth(), scaleY = extent.getHeight();
    const localTransform = out;
    mat4.identity(localTransform);
    const trans = vec3.copy(TEMP_VEC, map.cameraLookAt);
    trans[2] = 0;//避免地图中心点存在高度情况下，地面跟着抬升
    mat4.translate(localTransform, localTransform, trans);
    mat4.scale(localTransform, localTransform, vec3.set(SCALE, scaleX, scaleY, 1));
    return localTransform;
}

export const EMPTY_COLOR = [0, 0, 0, 0];

export function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
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
        color = colorCache[key] = colorCache[key] || Color(color).unitArray();
    }
    for (let i = 0; i < color.length; i++) {
        out[i] = color[i];
    }
    if (color.length === 3) {
        out[3] = 1;
    }
    return out;
}

export function normalizeColor255(out, color) {
    if (!Array.isArray(color)) {
        const key = color;
        color = colorCache[key] = colorCache[key] || Color(color).unitArray();
    }
    for (let i = 0; i < color.length; i++) {
        out[i] = color[i] * 255;
    }
    if (out.length === 3) {
        out.push(255);
    }
    return out;
}

export function coordinateToWorld(map, coordinate, z = 0) {
    if (!map || !(coordinate instanceof Coordinate)) {
        return null;
    }
    const p = map.coordinateToPointAtRes(coordinate, map.getGLRes());
    return [p.x, p.y, z];
}

export function createGLContext(canvas, options, onlyWebGL1) {
    const names = onlyWebGL1 ? ['webgl', 'experimental-webgl'] : ['webgl2', 'webgl', 'experimental-webgl'];
    let gl = null;
    /* eslint-disable no-empty */
    for (let i = 0; i < names.length; ++i) {
        try {
            gl = canvas.getContext(names[i], options);
        } catch (e) {}
        if (gl) {
            break;
        }
    }
    if (!gl) {
        console.error('Browser doesn\'t support WebGL.');
    }
    return gl;
    /* eslint-enable no-empty */
}
