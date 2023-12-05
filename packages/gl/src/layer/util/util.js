import * as maptalks from 'maptalks';
const supportAssign = typeof Object.assign === 'function';
import { vec2, vec3, mat4 } from 'gl-matrix';
import Color from 'color';
import { Coordinate } from 'maptalks';

/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 */
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
    mat4.translate(localTransform, localTransform, map.cameraLookAt);
    mat4.scale(localTransform, localTransform, vec3.set(SCALE, scaleX, scaleY, 1));
    return localTransform;
}

const DEFAULT_TEX_OFFSET = [0, 0];
const COORD0 = new maptalks.Coordinate(0, 0);
const COORD1 = new maptalks.Coordinate(0, 0);
const ARR2_0 = [];
const ARR2_1 = [];
const UNIFORMS = [];

export function computeUVUniforms(map,
    xmin, ymin, extentWidth, extentHeight,
    patternOrigin, patternWidth, patternHeight, texAspect,
    uvScale,
    isOffsetInMeter, offsetValue, uvOffsetAnim) {
    const glRes = map.getGLRes();
    if (patternOrigin) {
        COORD0.set(patternOrigin[0], patternOrigin[1]);
        map.coordToPointAtRes(COORD0, glRes, COORD1);
        xmin = xmin - COORD1.x;
        ymin = ymin - COORD1.y;
    }

    const pointOrigin = patternOrigin ? COORD0 : null;
    // compute uv offset
    offsetValue = vec2.copy(ARR2_1, offsetValue);
    const uvOffset = !isOffsetInMeter && offsetValue || DEFAULT_TEX_OFFSET;
    let meterOffset = isOffsetInMeter && offsetValue || DEFAULT_TEX_OFFSET;
    meterOffset = vec2.copy(ARR2_0, meterOffset);
    if (meterOffset[0]) {
        meterOffset[0] = meterToPoint(map, meterOffset[0], pointOrigin);
    }
    if (meterOffset[1]) {
        meterOffset[1] = meterToPoint(map, meterOffset[1], pointOrigin, 1);
    }

    // compute uv scale
    let texWidth = 0.5;
    if (patternWidth) {
        texWidth = meterToPoint(map, patternWidth, pointOrigin);
    }

    let texHeight = texWidth / texAspect;
    if (patternHeight) {
        texHeight = meterToPoint(map, patternHeight, pointOrigin, 1);
    }

    // 乘以2是因为plane的长宽是extent的2倍
    const scaleX = extentWidth / texWidth;
    const scaleY = extentHeight / texHeight;

    const hasUVAnim = uvOffsetAnim && (uvOffsetAnim[0] || uvOffsetAnim[1]);
    if (hasUVAnim) {
        const timeStamp = performance.now() / 1000;
        // 256 是noiseTexture的高宽，乘以256可以保证动画首尾平滑过渡，不会出现跳跃
        // const speed = hasNoise ? 50000 : 1000;
        // const scale = (hasNoise ? 256 : 1);
        let animX = uvOffsetAnim[0];
        let animY = uvOffsetAnim[1];
        if (isOffsetInMeter) {
            animX = -meterToPoint(map, uvOffsetAnim[0], pointOrigin);
            animY = -meterToPoint(map, uvOffsetAnim[1], pointOrigin, 1);
        }
        if (uvOffsetAnim[0]) {
            if (isOffsetInMeter) {
                meterOffset[0] = timeStamp * animX;
            } else {
                uvOffset[0] = timeStamp * animX;
            }
        }
        if (uvOffsetAnim[1]) {
            if (isOffsetInMeter) {
                meterOffset[1] = timeStamp * animY;
            } else {
                uvOffset[1] = timeStamp * animY;
            }
        }
    }

    const uvStartX = ((xmin + meterOffset[0]) / (texWidth / uvScale[0]));
    const uvStartY = ((ymin - meterOffset[1]) / (texHeight / uvScale[1]));

    UNIFORMS[0] = scaleX * uvScale[0];
    UNIFORMS[1] = scaleY * uvScale[1];
    UNIFORMS[2] = uvStartX;
    UNIFORMS[3] = uvStartY;
    UNIFORMS[4] = uvOffset;
    return UNIFORMS;
}

function meterToPoint(map, meter, patternOrigin, isYAxis) {
    const glRes = map.getGLRes();
    const point = map.distanceToPointAtRes(meter, meter, glRes, patternOrigin ? COORD0 : null, COORD1);
    return isYAxis ? point.y : point.x;
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
        color = colorCache[key] = colorCache[key] || Color(color).array();
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
        color = colorCache[key] = colorCache[key] || Color(color).array();
        for (let i = 0; i < color.length; i++) {
            out[i] = color[i];
        }
    } else {
        for (let i = 0; i < color.length; i++) {
            out[i] = color[i] * 255;
        }
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
    return gl;
    /* eslint-enable no-empty */
}
