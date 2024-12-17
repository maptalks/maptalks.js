import { getGLTFLoaderBundle } from './GLTFBundle'
import REGL, { Regl } from '@maptalks/regl';
import { AttributeBufferData, AttributeType, NumberArray, TypedArray } from '../types/typings';

/**
 * 对象是否是字符串
 * @english
 * Check whether the object is a string
 * @param obj
 */
export function isString(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'string' || (obj.constructor !== null && obj.constructor === String);
}

/**
 * 对象是否是null或undefined
 * @english
 * Whether the object is null or undefined.
 * @param  obj - object
 */
export function isNil(obj) {
    return obj == null;
}

export function defined(obj) {
    return !isNil(obj);
}

/**
 * 对象是否是函数
 * @english
 * Check whether the object is a function
 * @param obj
 */
export function isFunction(obj) {
    if (isNil(obj)) {
        return false;
    }
    return typeof obj === 'function' || (obj.constructor !== null && obj.constructor === Function);
}

/**
 * 将后续所有对象属性合并到第一个dest对象中
 * @english
 * Merges the properties of sources into destination object.
 * @param dest - object to extend
 * @param src - sources
 */
export function extend(dest, ...src) {
    Object.assign(dest, ...src);
    return dest;
}

/**
 * 将后续所有对象属性合并到第一个dest对象中，但忽略undefined或null的属性
 * @english
 * Merges the properties of sources into destination object without nil properties.
 * @param dest - object to extend
 * @param src - sources
 */
export function extendWithoutNil(dest, ...args) {
    for (let i = 0; i < args.length; i++) {
        const src = args[i];
        for (const k in src) {
            if (src[k] !== undefined && src[k] !== null) {
                dest[k] = src[k];
            }
        }
    }
    return dest;
}

// export function extend2(dest) {
//     for (let i = 1; i < arguments.length; i++) {
//         const src = arguments[i];
//         for (const k in src) {
//             if (dest[k] === undefined) {
//                 dest[k] = src[k];
//             }
//         }
//     }
//     return dest;
// }

/**
 * 检查是否是个数值
 * @english
 * Whether val is a number and not a NaN.
 * @param  val - val
 */
export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}

/**
 * 计算值的log2
 * @english
 * compute value's log2
 * @param x - value to log
 * @returns
 */
export function log2(x: number) {
    return Math.log2(x);
}

/**
 * 归一化数组
 * @english
 * normalize a number array
 * @param out - array receives result
 * @param arr - array
 * @returns out
 */
export function normalize(out: NumberArray, arr: ArrayLike<number>) {
    let sum = 0;
    for (let i = 0, l = arr.length; i < l; i++) {
        sum += arr[i];
    }
    for (let i = 0, l = arr.length; i < l; i++) {
        out[i] = arr[i] / sum;
    }
    return out;
}

/**
 * 两个数值之间的比例推算
 *
 * @english
 * Interpolate between two number.
 *
 * @param from  - from value
 * @param to    - to value
 * @param t     - interpolation factor between 0 and 1
 * @returns     interpolated value
 */
export function interpolate(a: number, b: number, t: number) {
    return (a * (1 - t)) + (b * t);
}

/**
 * 检查对象是否是数组或者类型数组
 * @english
 * Check if is an Array or a TypedArray
 * @param arr - input object
 * @returns
 */
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
 * 对两个矢量执行线性推算
 *
 * @english
 * Performs a linear interpolation between two number's
 *
 * @param out   - the receiving vector
 * @param a     - the first operand
 * @param b     - the second operand
 * @param t     - interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function lerp(out: NumberArray, a: NumberArray, b: NumberArray, t: number) {
    for (let i = 0; i < out.length; i++) {
        out[i] = a[i] + t * (b[i] - a[i]);
    }
    return out;
}

/**
 * 将input数组的值设置给out
 * @english
 * Set input array's value to out
 * @param out - the receiving array
 * @param input - input array
 * @returns out
 */
export function set(out: NumberArray, input: NumberArray) {
    for (let i = 0; i < out.length; i++) {
        out[i] = input[i];
    }
    return out;
}
/**
 * 根据Position的最大值，选择一个合适的TypedArray
 * @english
 * Choose a TypedArray for position according to its max value
 * @param max - position's max value
 * @returns
 */
export function getPosArrayType(max: number) {
    max = Math.abs(max);
    if (max < 128) return Int8Array;
    if (max < 65536 / 2) return Int16Array;
    return Float32Array;
}

/**
 * n大于max时返回max，n小于min时返回min，否则返回n
 * @english
 * Clamp input value between min and max
 * @param n - input value
 * @param min - min value
 * @param max - max value
 */
export function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

/**
 * 检查当前环境是否支持VAO
 * @english
 * Check if current context supports VAO
 * @param regl regl context
 * @returns
 */
export function isSupportVAO(regl: Regl) {
    // return false;
    return regl && regl.hasExtension('oes_vertex_array_object');
}

/**
 * Object.hasOwnProperty的包装方法
 * @english
 * Check if object hasOwnProperty of property
 * @param obj - object
 * @param prop - property
 * @returns
 */
export function hasOwn(obj, prop: string) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * 获取buffer的byte大小
 * @english
 * Get buffer's size in bytes
 * @param buffer
 */
export function getBufferSize(buffer: AttributeBufferData | AttributeType): number {
    if ((buffer as AttributeBufferData).data) {
        buffer = (buffer as AttributeBufferData);
        if ((buffer.data as TypedArray).BYTES_PER_ELEMENT) {
            return buffer.data.length * (buffer.data as TypedArray).BYTES_PER_ELEMENT;
        } else if (buffer.data.length) {
            return buffer.data.length * 4;
        }
    } else if ((buffer as TypedArray).BYTES_PER_ELEMENT) {
        return (buffer as TypedArray).length * (buffer as TypedArray).BYTES_PER_ELEMENT;
    } else if ((buffer as number[]).length) {
        // FLOAT32 in default
        return (buffer as number[]).length * 4;
    }else if ((buffer as AttributeBufferData).buffer && (buffer as AttributeBufferData).buffer.destroy) {
        return (buffer as AttributeBufferData).buffer['_buffer'].byteLength;
    }
    return 0;
}

/**
 * 获取regl texture对象的bytes大小
 * @english
 * Get regl texture size in bytes
 * @param tex - regl rexture
 * @returns
 */
export function getTexMemorySize(tex: REGL.Texture) {
    return tex.width * tex.height * getTextureChannels(tex.format) * getTextureByteWidth(tex.type) * (tex['_reglType'] === 'textureCube' ? 6 : 1);
}

/**
 * 获取regl texture的byte width
 * @english
 * Get regl texture's byte width
 * @param type - regl texture's type
 * @returns
 */
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

/**
 * 获取regl texture 的channels数量
 * @english
 * Get regl texture's number of channels
 * @param format - regl texture's format
 * @returns
 */
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

/**
 * 检查该attribute数据是否处于interleaved数据中
 * @english
 * Check if this attribute data is in interleaved stride
 * @param dataObj attribute object
 * @returns
 */
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
    const gltf = getGLTFLoaderBundle();
    const ctor = gltf.GLTFLoader.getTypedArrayCtor(dataObj.componentType);
    return dataObj.byteStride > 0 && dataObj.byteStride !== dataObj.itemSize * ctor.BYTES_PER_ELEMENT;
}

/**
 * 检查该attribute数据是否是interleaved
 * @english
 * Check if this attribute data is an interleaved data
 * @param dataObj attribute object
 * @returns
 */
export function isInterleaved(dataObj) {
    return dataObj && (dataObj.stride > 0 || isInStride(dataObj));
    // const { stride, componentType, count, size } = dataObj;
    // const bytesPerElement = gltf.GLTFLoader.getTypedArrayCtor(componentType).BYTES_PER_ELEMENT;
    // return stride > bytesPerElement * count * size;
}

/**
 * 获取该webgl上下文支持的压缩纹理格式
 * @english
 * Get webgl context's supported formats for compressed texture
 * @param gl
 * @returns
 */
export function getSupportedFormats(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    return {
        'etc': !!gl.getExtension('WEBGL_compressed_texture_etc'),
        'etc1': !!gl.getExtension('WEBGL_compressed_texture_etc1'),
        's3tc': !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
        'pvrtc': !!gl.getExtension('WEBGL_compressed_texture_pvrtc'),
        'astc': !!gl.getExtension('WEBGL_compressed_texture_astc'),
        'bc7': !!gl.getExtension('EXT_texture_compression_bptc'),
    };
}

/**
 * 获取字符串的hash值
 * @english
 * Get string's hash code
 * @param s input string
 * @returns
 */
export function hashCode(s: string) {
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

/**
 * 值是否是2的n次幂
 * @english
 * Get the nearest power of 2 that is less than this value
 * @param value - input value
 * @returns
 */
export function isPowerOfTwo(value: number) {
    return (value & (value - 1)) === 0 && value !== 0;
}

/**
 * 获取小于该值的最接近的2次幂
 * @english
 * Get power of 2 that smaller than
 * @param value - input value
 * @returns
 */
function floorPowerOfTwo(value) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

// function ceilPowerOfTwo(value) {
//     return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
// }

function resizeFromArray(arr: NumberArray, width: number, height: number) {
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
    let debugCanvas = document.getElementById('_debug_resize_canvas') as HTMLCanvasElement;
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

export function resizeToPowerOfTwo(image: HTMLImageElement | NumberArray, width?: number, height?: number) {
    if (isArray(image)) {
        image = image as NumberArray;
        if (!isPowerOfTwo(width) || !isPowerOfTwo(height)) {
            return resizeFromArray(image, width, height);
        } else {
            return image;
        }
    }
    image = image as HTMLImageElement;
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

export function supportNPOT(regl: any) {
    return regl['_gl'] instanceof WebGL2RenderingContext;
}
