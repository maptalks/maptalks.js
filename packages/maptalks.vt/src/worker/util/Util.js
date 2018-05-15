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

export function exportIndices(indices) {
    return indices.length <= 256 ? new Uint8Array(indices)  : indices.length <= 65536 ? new Uint16Array(indices) : new Uint32Array(indices);
}
