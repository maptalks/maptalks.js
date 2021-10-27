import transcodeKTX from './transcodeKTX.js';

const promisify = function(...args) {
    const decoded = transcodeKTX.call(this, ...args);
    return Promise.resolve(decoded);
}

export default promisify;

const getGlobal = function () {
  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
};

const globals = getGlobal();
if (globals.maptalksgl) {
    globals.maptalksgl.transcoders.registerTranscoder('ktx2', promisify);
    globals.maptalksgl.transcoders.registerTranscoder('cttf', promisify);
}
