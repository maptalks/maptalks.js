/**
 * Create and copy from data to typed arrays as definitions
 * @param {Object} format type array definitions
 * @param {Number[]} data data copied from
 * @returns {Object} typed arrays
 */
export function fillTypedArray(format, data) {
    const arrays = {};
    const dataWidth = getFormatWidth(format);
    const count = data.length / dataWidth;
    for (const p in format) {
        const d = format[p];
        const type = d.type;
        const width = d.width;
        const name = d.name;
        arrays[name] = new type(count * width);
    }

    for (let i = 0; i < count; i++) {
        let p = 0;
        for (const prop in format) {
            const d = format[prop];
            const width = d.width;
            const name  = d.name;
            const arr = arrays[name];
            for (let ii = 0; ii < width; ii++) {
                arr[i * width + ii] = data[i * dataWidth + p + ii];
            }
            p += width;
        }
    }
    return arrays;
}

export function getFormatWidth(format) {
    let width = 0;
    for (const p in format) {
        width += format[p].width;
    }
    return width;
}

export function getIndexArrayType(max) {
    // if (max < 256) return Uint8Array;
    // according to http://www.webglinsights.com/, Uint8Array performs badly in directx according to ANGLE
    if (max < 65536) return Uint16Array;
    return Uint32Array;
}

export function getPosArrayType(max) {
    max = Math.abs(max);
    if (max < 128) return Int8Array;
    if (max < 65536 / 2) return Int16Array;
    return Int32Array;
}
