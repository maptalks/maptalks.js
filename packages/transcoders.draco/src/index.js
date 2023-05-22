import transcodeDRC from './transcodeDRC.js';

const promisify = function(...args) {
    const decoded = transcodeDRC(...args);
    return Promise.resolve(decoded);
}

export default promisify;
