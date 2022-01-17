const fs = require('fs');
const assert = require('assert');


const expectedArr = fs.readFileSync('./basis_transcoder.wasm');
const base64 = fs.readFileSync('./basis_transcoder.wasm', { encoding: 'base64' });

let content = `function base64ToArrayBuffer(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

const wasmContent = '`;
content += base64 + '\'';
content += `
const wasmBuf = base64ToArrayBuffer(wasmContent);
export default wasmBuf;
`;

fs.writeFileSync('./basis_wasm.js', content);


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
