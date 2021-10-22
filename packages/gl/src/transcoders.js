const getGlobal = function () {
  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
};

const globals = getGlobal();

const transcoders = globals['___gl_transcoders'] = globals['___gl_transcoders'] || {};

function inject(chunk) {
    // 奇怪的变量名是为了避免与worker源代码中的变量名冲突
    const prefix = 'function (exports) {';
    const fnString = chunk.toString();
    const transcoders = globals['___gl_transcoders'] = globals['___gl_transcoders'] || {};
    let injected = `${prefix}
    const _____getGlobal = ${getGlobal.toString()};
    const g___lobals = _____getGlobal()
    const tran_____scoders = g___lobals.___gl_transcoders = g___lobals.___gl_transcoders || {};`
    for (const p in transcoders) {
        if (p === 'inject') {
            continue;
        }
        injected += 'tran_____scoders["' + p + '"] =' + transcoders[p].toString() + '\n;';
    }
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

transcoders.registerTranscoder = registerTranscoder;
transcoders.getTranscoder = getTranscoder;

export default transcoders;
export { getTranscoder, registerTranscoder };
