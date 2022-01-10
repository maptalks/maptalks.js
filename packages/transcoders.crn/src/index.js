import transcodeCRNToDXT from './transcodeCRNToDXT.js';

const promisify = function(...args) {
    // debugger
    const decoded = transcodeCRNToDXT.call(this, ...args);
    return Promise.resolve(decoded);
}
export default promisify;
