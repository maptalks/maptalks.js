import * as gltf from '@maptalks/gltf-loader';

/**
 * Check whether the object is a string
 * @param {Object} obj
 * @return {Boolean}
 */
export function isString(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'string' || (obj.constructor !== null && obj.constructor === String);
}

/**
 * Whether the object is null or undefined.
 * @param  {Object}  obj - object
 * @return {Boolean}
 */
export function isNil(obj) {
    return obj == null;
}

export function defined(obj) {
    return !isNil(obj);
}

/**
 * Check whether the object is a function
 * @param {Object} obj
 * @return {Boolean}
 */
export function isFunction(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'function' || (obj.constructor !== null && obj.constructor === Function);
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

export function extend1(dest) {
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            if (src[k] !== undefined && src[k] !== null) {
                dest[k] = src[k];
            }
        }
    }
    return dest;
}

export function extend2(dest) {
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            if (dest[k] === undefined) {
                dest[k] = src[k];
            }
        }
    }
    return dest;
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

export function log2(x) {
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

export function normalize(out, arr) {
    let sum = 0;
    for (let i = 0, l = arr.length; i < l; i++) {
        sum += arr[i];
    }
    for (let i = 0, l = arr.length; i < l; i++) {
        out[i] = arr[i] / sum;
    }
    return out;
}

/*
 * Interpolate between two number.
 *
 * @param {Number} from
 * @param {Number} to
 * @param {Number} t interpolation factor between 0 and 1
 * @returns {Number} interpolated color
 */
export function interpolate(a, b, t) {
    return (a * (1 - t)) + (b * t);
}


export function isArray(arr) {
    return Array.isArray(arr) ||
        (arr instanceof Uint8Array) ||
        (arr instanceof Int8Array) ||
        (arr instanceof Uint16Array) ||
        (arr instanceof Int16Array) ||
        (arr instanceof Uint32Array) ||
        (arr instanceof Int32Array) ||
        (arr instanceof Uint8ClampedArray) ||
        (arr instanceof Float32Array) ||
        (arr instanceof Float64Array);
}

/**
 * Performs a linear interpolation between two number's
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function lerp(out, a, b, t) {
    for (let i = 0; i < out.length; i++) {
        out[i] = a[i] + t * (b[i] - a[i]);
    }
    return out;
}

export function set(out, input) {
    for (let i = 0; i < out.length; i++) {
        out[i] = input[i];
    }
    return out;
}

export function getPosArrayType(max) {
    max = Math.abs(max);
    if (max < 128) return Int8Array;
    if (max < 65536 / 2) return Int16Array;
    return Float32Array;
}

export function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

export function isSupportVAO(regl) {
    // return false;
    return regl && regl.hasExtension('oes_vertex_array_object');
}

export function hasOwn(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function getBufferSize(buffer) {
    if (buffer.data) {
        if (buffer.data.BYTES_PER_ELEMENT) {
            return buffer.data.length * buffer.data.BYTES_PER_ELEMENT;
        } else if (buffer.data.length) {
            return buffer.data.length * 4;
        }
    } else if (buffer.BYTES_PER_ELEMENT) {
        return buffer.length * buffer.BYTES_PER_ELEMENT;
    } else if (buffer.length) {
        // FLOAT32 in default
        return buffer.length * 4;
    }else if (buffer.buffer && buffer.buffer.destroy) {
        return buffer.buffer['_buffer'].byteLength;
    }
    return 0;
}

export function getTexMemorySize(tex) {
    return tex.width * tex.height * getTextureChannels(tex.format) * getTextureByteWidth(tex.type) * (tex['_reglType'] === 'textureCube' ? 6 : 1);
}


export function getTextureByteWidth(type) {
    if (type === 'uint8') {
        return 1;
    } else if (type === 'uint16' || type === 'float16' || type === 'half float') {
        return 2;
    } else if (type === 'uint32' || type === 'float' || type === 'float32') {
        return 4;
    }
    return 0;
}

export function getTextureChannels(format) {
    if (format === 'depth' || format === 'alpha' || format === 'luminance') {
        return 1;
    } else if (format === 'luminance alpha' || format === 'depth stencil') {
        return 2;
    } else if (format === 'srgba' || format === 'rgb5 a1' || format.substring(0, 4) === 'rgba') {
        return 4;
    } else if (format === 'srgb' || format.substring(0, 3) === 'rgb') {
        return 3;
    }
    return 1;
}

export function isInStride(dataObj) {
    // if (!array || !array.buffer) {
    //     return false;
    // }
    // const bytesLen = array.length * array.BYTES_PER_ELEMENT;
    // const bufLen = array.buffer.byteLength;
    // return bytesLen < bufLen;
    if (!dataObj.componentType) {
        return false;
    }
    const ctor = gltf.GLTFLoader.getTypedArrayCtor(dataObj.componentType);
    return dataObj.byteStride > 0 && dataObj.byteStride !== dataObj.itemSize * ctor.BYTES_PER_ELEMENT;
}


export function isInterleaved(dataObj) {
    return dataObj && (dataObj.stride > 0 || isInStride(dataObj));
    // const { stride, componentType, count, size } = dataObj;
    // const bytesPerElement = gltf.GLTFLoader.getTypedArrayCtor(componentType).BYTES_PER_ELEMENT;
    // return stride > bytesPerElement * count * size;
}

export function getSupportedFormats(gl) {
    return {
        'etc': !!gl.getExtension('WEBGL_compressed_texture_etc'),
        'etc1': !!gl.getExtension('WEBGL_compressed_texture_etc1'),
        's3tc': !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
        'pvrtc': !!gl.getExtension('WEBGL_compressed_texture_pvrtc'),
        'astc': !!gl.getExtension('WEBGL_compressed_texture_astc'),
        'bc7': !!gl.getExtension('EXT_texture_compression_bptc'),
    };
}

export function hashCode(s) {
    let hash = 0;
    const strlen = s && s.length || 0;
    if (!strlen) {
        return hash;
    }
    let c;
    for (let i = 0; i < strlen; i++) {
        c = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}


export function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0 && value !== 0;
}

function floorPowerOfTwo(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

// function ceilPowerOfTwo(value) {
//     return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
// }

function resizeFromArray(arr, width, height) {
    let newWidth = width;
    let newHeight = height;
    if (!isPowerOfTwo(width)) {
        newWidth = floorPowerOfTwo(width);
    }
    if (!isPowerOfTwo(height)) {
        newHeight = floorPowerOfTwo(height);
    }

    const imageData = new ImageData(new Uint8ClampedArray(arr), width, height);

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = width;
    srcCanvas.height = height;
    srcCanvas.getContext('2d').putImageData(imageData, 0, 0);

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.getContext('2d').drawImage(srcCanvas, 0, 0, width, height, 0, 0, newHeight, newHeight);
    console.warn(`Texture's size is not power of two, resize from (${width}, ${height}) to (${newWidth}, ${newHeight})`);
    let debugCanvas = document.getElementById('_debug_resize_canvas');
    if (!debugCanvas) {
        debugCanvas = document.createElement('canvas');
        debugCanvas.id = '_debug_resize_canvas';
        document.body.appendChild(debugCanvas);
    }
    debugCanvas.width = newWidth;
    debugCanvas.height = newHeight;
    debugCanvas.getContext('2d').drawImage(canvas, 0, 0);
    return canvas;
}

export function resizeToPowerOfTwo(image, width, height) {
    if (isArray(image)) {
        if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
            return resizeFromArray(image, width, height);
        } else {
            return image;
        }
    }
    if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
        return image;
    }
    width = image.width;
    height = image.height;
    if (!isPowerOfTwo(width)) {
        width = floorPowerOfTwo(width);
    }
    if (!isPowerOfTwo(height)) {
        height = floorPowerOfTwo(height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    const url = image.src;
    const idx = url.lastIndexOf('/') + 1;
    const filename = url.substring(idx);
    console.warn(`Texture(${filename})'s size is not power of two, resize from (${image.width}, ${image.height}) to (${width}, ${height})`);
    return canvas;
}
