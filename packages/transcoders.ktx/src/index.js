import transcodeKTX from './transcodeKTX.js';

const promisify = function(...args) {
    const decoded = transcodeKTX.call(this, ...args);
    return Promise.resolve(decoded);
}

export default promisify;
