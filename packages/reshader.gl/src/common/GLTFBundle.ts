const getGlobal = function () {
    if (typeof globalThis !== 'undefined') { return globalThis; }
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    throw new Error('unable to locate global object');
};

export function getGLTFLoaderBundle() {
    return getGlobal()['maptalks_gltf_loader'];
}
