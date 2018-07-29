/**
 * Create and copy from data to typed arrays as definitions
 * @param {Object} defs type array definitions
 * @param {Number[]} data data copied from
 * @returns {Object} typed arrays
 */
export function fillTypedArray(defs, data) {
    const arrays = {};
    let dataWidth = 0;
    for (const d of defs) {
        dataWidth += d.width;
    }
    const count = data.length / dataWidth;
    for (const d of defs) {
        const type = d.type;
        const width = d.width;
        const name = d.name;
        arrays[name] = new type(count * width);
    }

    for (let i = 0; i < count; i++) {
        let p = 0;
        for (const d of defs) {
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
