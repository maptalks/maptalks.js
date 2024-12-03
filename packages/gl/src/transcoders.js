const getGlobal = function () {
    if (typeof globalThis !== 'undefined') { return globalThis; }
    if (typeof self !== 'undefined') { return self; }
    if (typeof window !== 'undefined') { return window; }
    if (typeof global !== 'undefined') { return global; }
    throw new Error('unable to locate global object');
};

const globals = getGlobal();

const transcoders = globals['gl_trans__coders'] = globals['gl_trans__coders'] || {};


function inject(chunk) {
    // 奇怪的变量名是为了避免与worker源代码中的变量名冲突
    const fnString = chunk.toString();
    const prefixIndex = fnString.indexOf('{') + 1;
    const prefix = fnString.substring(0, prefixIndex);

    const transcoders = globals['gl_trans__coders'] = globals['gl_trans__coders'] || {};
    let injected = `${prefix}
    const _____getGlobal = ${getGlobal.toString()};
    const g___lobals = _____getGlobal()
    const tran_____scoders = g___lobals['gl_trans__coders'] = g___lobals['gl_trans__coders'] || {};`
    for (const p in transcoders) {
        if (p === 'inject' || p === 'getTranscoder' || p === 'registerTranscoder') {
            continue;
        }
        injected += 'tran_____scoders["' + p + '"] =' + transcoders[p].toString() + '\n;';
    }
    const gltfBundle = getGlobal()['maptalks_gltf_loader_bundle'];
    injected += '\n(' + gltfBundle.toString() + ')({});\n';
    injected += '\n' + fnString.substring(prefix.length);
    return injected;
}
transcoders['inject'] = inject;

function getTranscoder(name/*, options*/) {
    return transcoders[name];
}

function registerTranscoder(name, fn) {
    transcoders[name] = fn;
}

function getGLTFLoaderBundle() {
    return getGlobal()['maptalks_gltf_loader'];
}

function registerGLTFLoaderBundle(fn) {
    getGlobal()['maptalks_gltf_loader_bundle'] = fn;
}

transcoders.registerTranscoder = registerTranscoder;
transcoders.getTranscoder = getTranscoder;

export default transcoders;
export { getTranscoder, registerTranscoder, getGLTFLoaderBundle, registerGLTFLoaderBundle };
