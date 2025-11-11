import { vec4 } from 'gl-matrix';

const R = 0xff0000, G = 0x00ff00, B = 0x0000ff;

export function unpack(id) {
    return [id & R, id & G, id & B];
}

export function pack3(array) {
    return array[2] * 256 * 256 + array[1] * 256 + array[0];
}

const bitDec = [1, 1 / 255, 1 / 65025, 1 / 16581375];

export function pack4(array) {
    return vec4.dot(array, bitDec);
}

const UINT8_VIEW = new Uint8Array(4);
const FLOAT_VIEW = new Float32Array(UINT8_VIEW.buffer);

export function packDepth(array) {
    UINT8_VIEW[0] = array[3];
    UINT8_VIEW[1] = array[2];
    UINT8_VIEW[2] = array[1];
    UINT8_VIEW[3] = array[0];
    return FLOAT_VIEW[0];
}
