//return MB size of arraybuffer
export function calArrayBufferSize(buffer) {
    if (!buffer) {
        return 0;
    }
    if (!(buffer instanceof ArrayBuffer)) {
        return 0;
    }
    return buffer.byteLength / 1048576;
}

export function isNumber(val) {
    return (typeof val === 'number') && !isNaN(val);
}
