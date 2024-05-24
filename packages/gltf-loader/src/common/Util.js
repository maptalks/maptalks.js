import { mat4, quat } from 'gl-matrix';

let id = 0;
export function uid() {
    return id++;
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

export function isNumber(obj) {
    return typeof obj === 'number' && isFinite(obj);
}

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

/**
 * Merges the properties of sources into destination object.
 * @param  {Object} dest   - object to extend
 * @param  {...Object} src - sources
 * @return {Object}
 */
export function extend(dest) {
    for (let i = 1; i < arguments.length; i++) {
        const src = arguments[i];
        for (const k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
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

export function getTypedArrayCtor(componentType) {
    switch (componentType) {
    case 0x1400:
        return Int8Array;
    case 0x1401:
        return Uint8Array;
    case 0x1402:
        return Int16Array;
    case 0x1403:
        return Uint16Array;
    case 0x1404:
        return Int32Array;
    case 0x1405:
        return Uint32Array;
    case 0x1406:
        return Float32Array;
    }
    throw new Error('unsupported bufferView\'s component type: ' + componentType);
}

export function isDataUri(uri) {
    // TODO: also check application/*, image/*
    return uri.indexOf('data:') === 0 && uri.indexOf('base64,') > 0;
}

export function atob(base64) {
    return typeof self !== 'undefined' ? self.atob(base64) : window.atob(base64);
}

export function btoa(buffer) {
    return typeof self !== 'undefined' ? self.btoa(buffer) : window.btoa(buffer);
}

export function dataUriToArrayBuffer(uri) {
    // console.time('base64');
    const base64 = uri.substring(uri.indexOf(',') + 1);
    const binaryStr = atob(base64);
    const byteLength = binaryStr.length;
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    // console.timeEnd('base64');
    return bytes.buffer;
}

const TMAT = [];
const RMAT = [];
const SMAT = [];
const EMPTY_T = [0, 0, 0];
const EMTPY_Q = quat.identity([]);
const EMPTY_S = [1, 1, 1];

export function getMatrix(out, node) {
    if (node.matrix) {
        return node.matrix;
    } else if (node.translation || node.scale || node.rotation) {
        const tm = mat4.fromTranslation(TMAT, node.translation || EMPTY_T);
        const rm = mat4.fromQuat(RMAT, node.rotation || EMTPY_Q);
        const sm = mat4.fromScaling(SMAT, node.scale || EMPTY_S);
        mat4.multiply(sm, rm, sm);
        return mat4.multiply(out, tm, sm);
    } else {
        return mat4.identity(out);
    }
}

export function readInterleavedArray(out, arrayBuffer, count, size, stride, byteOffset, componentType) {
    const ctor = getTypedArrayCtor(componentType);
    const bytesPerElement = ctor.BYTES_PER_ELEMENT;
    if ((stride === 0 || stride === size * bytesPerElement) && byteOffset % bytesPerElement === 0) {
        const src = new ctor(arrayBuffer, byteOffset, count * size);
        out.set(src);
        return out;
    }
    if (stride === 0) {
        stride = size * bytesPerElement;
    }
    const tempUint8 = new Uint8Array(size * bytesPerElement);
    for (let i = 0; i < count; i++) {
        let tempTypeArray = null;
        const start = stride * i + byteOffset;
        const uint8Arr = new Uint8Array(arrayBuffer, start, size * bytesPerElement);
        //typedArray拷贝
        tempUint8.set(uint8Arr);
        tempTypeArray = new ctor(tempUint8.buffer, 0, size);
        for (let j = 0; j < size; j++) {
            out[i * size + j] = tempTypeArray[j];
        }
    }
    return out;
}


const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
export function bufferToString(buffer, byteOffset, byteLength) {
    const arr = new Uint8Array(buffer, byteOffset, byteLength);
    return textDecoder.decode(arr);
}
