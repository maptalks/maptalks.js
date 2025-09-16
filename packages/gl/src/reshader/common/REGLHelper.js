import { extend, isArray } from './Util';


const reglPrimitives = ['points', 'lines', 'line strip', 'line loop', 'triangles', 'triangle strip', 'triangle fan'];
export function getPrimitive(mode) {
    return reglPrimitives[mode];
}

const materialTypes = {
    0x1401: 'uint8',
    0x1403: 'uint16',
    0x1405: 'uint32',
    0x1406: 'float',
    0x8D61: 'half float'
};
export function getMaterialType(type) {
    return materialTypes[type];
}


export function getArrayType(array) {
    if (array instanceof Uint8Array) {
        return 'uint8';
    } else if (array instanceof Int8Array) {
        return 'int8';
    } else if (array instanceof Uint16Array) {
        return 'uint16';
    } else if (array instanceof Int16Array) {
        return 'int16';
    } else {
        return 'float';
    }
}

const materialFormats = {
    0x1906: 'alpha',
    0x1907: 'rgb',
    0x1908: 'rgba',
    0x1909: 'luminance',
    0x190A: 'luminance alpha',
    0x83f0: 'rgb s3tc dxt1',
    0x83f1: 'rgba s3tc dxt1',
    0x83f2: 'rgba s3tc dxt3',
    0x83f3: 'rgba s3tc dxt5',
    0x8c00: 'rgb pvrtc 4bppv1',
    0x8c01: 'rgb pvrtc 2bppv1',
    0x8c02: 'rgba pvrtc 4bppv1',
    0x8c03: 'rgba pvrtc 2bppv1',
    0x8c92: 'rgb atc',
    0x8C93: 'rgba atc explicit alpha',
    0x87EE: 'rgba atc interpolated alpha',
    0x8D64: 'rgb etc1',
    0x9274: 'rgb etc2'
};
export function getMaterialFormat(format) {
    return materialFormats[format];
}


const textureMagFilters = {
    0x2601: 'linear',
    0x2600: 'nearest'
};
export function getTextureMagFilter(filter) {
    return textureMagFilters[filter];
}


const textureMinFilters = {
    0x2601: 'linear',
    0x2600: 'nearest',
    0x2700: 'nearest mipmap nearest',
    0x2701: 'linear mipmap nearest',
    0x2702: 'nearest mipmap linear',
    0x2703: 'linear mipmap linear',
};
export function getTextureMinFilter(filter) {
    return textureMinFilters[filter];
}

const textureWrap = {
    0x2901: 'repeat',
    0x812F: 'clamp',
    0x8370: 'mirror'
};
export function getTextureWrap(wrap) {
    return textureWrap[wrap];
}

const BUFFER_KEY = '__reshader_webgl_buffer';
const TEXTURE_KEY = '__reshader_webgl_tex';
// 避免重复创建webgl buffer
export function getUniqueREGLBuffer(regl, data, options) {
    let array;
    if (isArray(data)) {
        if (data.buffer && data.byteOffset !== undefined) {
            array = data;
        }
    } else if (data.array && data.array.buffer && data.array.byteOffset !== undefined) {
        array = data.array;
    }
    if (!array) {
        return null;
    }
    const arrayBuffer = array.buffer;
    const byteOffset = array.byteOffset;
    if (!arrayBuffer[BUFFER_KEY]) {
        arrayBuffer[BUFFER_KEY] = {};
    }
    let buffer = arrayBuffer[BUFFER_KEY][byteOffset];
    if (!buffer) {
        const info = {};
        if (options)  {
            extend(info, options);
        }
        info.data = array;
        if (!info.type) {
            info.type = getArrayType(array);
        }
        buffer = regl.buffer(info);
        // console.log(count++, (array.byteLength / 1024 / 1024).toFixed(1));
        arrayBuffer[BUFFER_KEY][byteOffset] = buffer;
    }
    return buffer;
}

export function getUniqueTexture(regl, texConfig) {
    const array = texConfig.data;
    if (!array || !array.buffer) {
        // 数据非类型数组，直接创建texture并返回
        return regl.texture(texConfig);
    }
    const arrayBuffer = array.buffer;
    const byteOffset = array.byteOffset;
    if (!arrayBuffer[TEXTURE_KEY]) {
        arrayBuffer[TEXTURE_KEY] = {};
    }
    let reglTex = arrayBuffer[TEXTURE_KEY][byteOffset];
    if (!reglTex) {
        reglTex = regl.texture(texConfig);
        arrayBuffer[TEXTURE_KEY][byteOffset] = reglTex;
    }
    return reglTex;
}
