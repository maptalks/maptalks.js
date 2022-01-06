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


const materialFormats = {
    0x1906: 'alpha',
    0x1907: 'rgb',
    0x1908: 'rgba',
    0x1909: 'luminance',
    0x190A: 'luminance alpha',
    0x83f0: 'rgb s3tc dxt1',
    0x83f2: 'rgba s3tc dxt3',
    0x83f3: 'rgba s3tc dxt5'
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

