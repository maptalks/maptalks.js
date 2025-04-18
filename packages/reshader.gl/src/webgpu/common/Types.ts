export function getGPUVertexType(array) {
    let format;
    if (Array.isArray(array) || array instanceof Float32Array) {
        format = 'float32';
    } else if (array instanceof Uint32Array) {
        format = 'uint32';
    } else if (array instanceof Int32Array) {
        format = 'sint32';
    } else if (array instanceof Uint16Array) {
        format = 'uint16';
    } else if (array instanceof Int16Array) {
        format = 'sint16';
    } else if (array instanceof Uint8Array) {
        format = 'uint8';
    } else if (array instanceof Int8Array) {
        format = 'sint8';
    }
    return format;
}

const component_ctors = {
    5120: { name: 'sint8', bytes: 1 },
    5122: { name: 'sint16', bytes: 2 },
    5124: { name: 'sint32', bytes: 4 },
    5121: { name: 'uint8', bytes: 1 },
    5123: { name: 'uint16', bytes: 2 },
    5125: { name: 'uint32', bytes: 4 },
    5126: { name: 'float32', bytes: 4 }
};
export function getFormatFromGLTFAccessor(componentType, itemSize) {
    const format = component_ctors[componentType].name;
    if (itemSize > 1) {
        return format + 'x' + itemSize;
    } else {
        return format;
    }
}

export function getBytesPerElementFromGLTFAccessor(componentType) {
    return component_ctors[componentType].bytes;
}

const PADDING_TYPES = {
    mat2x3f: { pad: [3, 1] },
    mat2x3h: { pad: [3, 1] },
    mat3x3f: { pad: [3, 1] },
    mat3x3h: { pad: [3, 1] },
    mat4x3f: { pad: [3, 1] },
    mat4x3h: { pad: [3, 1] },
    mat3x4f: { pad: [3, 1] },
    mat3x4h: { pad: [3, 1] },
};

export function isPaddingType(type) {
    return PADDING_TYPES[type.name];
}
