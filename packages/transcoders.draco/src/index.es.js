import transcodeDRC from './transcodeDRC.js';
import transcoders from '@maptalks/gl/dist/transcoders';

let promisify;

transcoders.registerTranscoder('draco', function () {
    promisify = function(...args) {
        const decoded = transcodeDRC.call(this, ...args);
        return Promise.resolve(decoded);
    };
    return promisify;
});
export default promisify;
