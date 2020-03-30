import { mat4, vec3 } from 'gl-matrix';

const SCALE = [];

export function getGroundTransform(out, map) {
    const extent = map['_get2DExtent'](map.getGLZoom());
    const scaleX = extent.getWidth(), scaleY = extent.getHeight();
    const localTransform = out;
    mat4.identity(localTransform);
    mat4.translate(localTransform, localTransform, map.cameraLookAt);
    mat4.scale(localTransform, localTransform, vec3.set(SCALE, scaleX, scaleY, 1));
    return localTransform;
}

const supportAssign = typeof Object.assign === 'function';

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

export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}
