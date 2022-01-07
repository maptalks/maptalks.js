import transcodeDRC from './transcodeDRC.js';

const promisify = function(...args) {
    const decoded = transcodeDRC.call(this, ...args);
    return Promise.resolve(decoded);
}

export default promisify;
