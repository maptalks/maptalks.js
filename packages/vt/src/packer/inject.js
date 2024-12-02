/* eslint-disable no-undef */
export const PACKER_KEY = 'maptalks_vt_packers';
export const getGlobal = function () {
    if (typeof globalThis !== 'undefined') { return globalThis; }
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    if (typeof global !== 'undefined') { return global; }
    throw new Error('unable to locate global object');
};

export function inject(chunk, packer) {
    // 奇怪的变量名是为了避免与worker源代码中的变量名冲突
    const fnString = chunk.toString();
    const prefixIndex = fnString.indexOf('{') + 1;
    const prefix = fnString.substring(0, prefixIndex);
    let injected = `${prefix}
    (` + packer.toString() + ')({});\n';
    injected += '\n' + fnString.substring(prefix.length);
    return injected;
}

export function getVectorPacker() {
    return getGlobal()[PACKER_KEY];
}

