const fs = require('fs');
const assert = require('assert');


const expectedArr = fs.readFileSync('./draco_decoder.wasm');
const base64 = fs.readFileSync('./draco_decoder.wasm', { encoding: 'base64' });

const content = 'const wasmContent = \'' + base64 + '\';\nexport default wasmContent;';

fs.writeFileSync('./draco_decoder_base64.js', content);


const arrBuf = base64ToArrayBuffer(base64);
const arr = new Uint8Array(arrBuf);
assert(arr.length === expectedArr.length, `${arr.length}, ${expectedArr.length}`);
for (let i = 0; i < expectedArr.length; i++) {
    assert(expectedArr[i] === arr[i]);
}

function base64ToArrayBuffer(base64) {
    var binary_string = Buffer.from(base64, 'base64').toString('binary');
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
