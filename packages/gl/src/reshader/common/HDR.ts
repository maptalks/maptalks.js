/* eslint-disable no-var */
// import { clamp } from './Util.js';

const toChar = String.fromCharCode;

const MINELEN = 8;
const MAXELEN = 0x7fff;
function rgbe2float(rgbe: number[], buffer: number[], offset: number, exposure: number) {
    if (rgbe[3] > 0) {
        const f = Math.pow(2.0, rgbe[3] - 128 - 8 + exposure);
        buffer[offset + 0] = rgbe[0] * f;
        buffer[offset + 1] = rgbe[1] * f;
        buffer[offset + 2] = rgbe[2] * f;
    } else {
        buffer[offset + 0] = 0;
        buffer[offset + 1] = 0;
        buffer[offset + 2] = 0;
    }
    buffer[offset + 3] = 1.0;
    return buffer;
}

// function encodeRGBM(buffer: number[], offset: number, range: number) {
//     const r = buffer[offset] / range;
//     const g = buffer[offset + 1] / range;
//     const b = buffer[offset + 2] / range;
//     let a = clamp(Math.max(Math.max(r, g), Math.max(b, 1E-6)), 0, 1);
//     a = Math.ceil(a * 255) / 255;

//     buffer[offset] = Math.min(255, r / a * 255);
//     buffer[offset + 1] = Math.min(255, g / a * 255);
//     buffer[offset + 2] = Math.min(255, b / a * 255);
//     buffer[offset + 3] = Math.min(255, a * 255);
// }

function uint82string(array: Uint8Array, offset: number, size: number) {
    let str = '';
    for (let i = offset; i < size; i++) {
        str += toChar(array[i]);
    }
    return str;
}

function copyrgbe(s: number[], t: number[]) {
    t[0] = s[0];
    t[1] = s[1];
    t[2] = s[2];
    t[3] = s[3];
}

// TODO : check
function oldReadColors(scan: number[][], buffer, offset, xmax) {
    let rshift = 0, x = 0, len = xmax;
    while (len > 0) {
        scan[x][0] = buffer[offset++];
        scan[x][1] = buffer[offset++];
        scan[x][2] = buffer[offset++];
        scan[x][3] = buffer[offset++];
        if (scan[x][0] === 1 && scan[x][1] === 1 && scan[x][2] === 1) {
            // exp is count of repeated pixels
            for (let i = (scan[x][3] << rshift) >>> 0; i > 0; i--) {
                copyrgbe(scan[x - 1], scan[x]);
                x++;
                len--;
            }
            rshift += 8;
        } else {
            x++;
            len--;
            rshift = 0;
        }
    }
    return offset;
}

function readColors(scan: number[][], buffer: Uint8Array, offset: number, xmax: number) {
    //@ts-expect-error 原始逻辑如此，忽略ts里的报错
    if ((xmax < MINELEN) | (xmax > MAXELEN)) {
        return oldReadColors(scan, buffer, offset, xmax);
    }
    let i = buffer[offset++];
    if (i !== 2) {
        return oldReadColors(scan, buffer, offset - 1, xmax);
    }
    scan[0][1] = buffer[offset++];
    scan[0][2] = buffer[offset++];

    i = buffer[offset++];
    if ((((scan[0][2] << 8) >>> 0) | i) >>> 0 !== xmax) {
        return null;
    }
    for (let i = 0; i < 4; i++) {
        for (let x = 0; x < xmax;) {
            let code = buffer[offset++];
            if (code > 128) {
                code = (code & 127) >>> 0;
                const val = buffer[offset++];
                while (code--) {
                    scan[x++][i] = val;
                }
            } else {
                while (code--) {
                    scan[x++][i] = buffer[offset++];
                }
            }
        }
    }
    return offset;
}


// http://www.graphics.cornell.edu/~bjw/rgbe.html
// Blender source
// http://radsite.lbl.gov/radiance/refer/Notes/picture_format.html
function parseRGBE(arrayBuffer: ArrayBufferLike, exposure = 0) {
    const data = new Uint8Array(arrayBuffer);
    const size = data.length;
    if (uint82string(data, 0, 2) !== '#?') {
        return null;
    }
    // find empty line, next line is resolution info
    for (var i = 2; i < size; i++) {
        if (toChar(data[i]) === '\n' && toChar(data[i + 1]) === '\n') {
            break;
        }
    }
    if (i >= size) { // not found
        return null;
    }
    // find resolution info line
    i += 2;
    let str = '';
    for (; i < size; i++) {
        const _char = toChar(data[i]);
        if (_char === '\n') {
            break;
        }
        str += _char;
    }
    // -Y M +X N
    const tmp = str.split(' ');
    const height = parseInt(tmp[1]);
    const width = parseInt(tmp[3]);
    if (!width || !height) {
        return null;
    }

    // read and decode actual data
    let offset = i + 1;
    const scanline = [];
    // memzero
    for (let x = 0; x < width; x++) {
        scanline[x] = [];
        for (let j = 0; j < 4; j++) {
            scanline[x][j] = 0;
        }
    }
    // let range = 0;
    const pixels: any = new Float32Array(width * height * 4);
    let offset2 = 0;
    for (let y = 0; y < height; y++) {
        offset = readColors(scanline, data, offset, width);
        if (!offset) {
            return null;
        }
        for (let x = 0; x < width; x++) {
            rgbe2float(scanline[x], pixels, offset2, exposure);
            // range = Math.max(range, pixels[offset2], pixels[offset2 + 1], pixels[offset2 + 2], pixels[offset2 + 3]);
            offset2 += 4;
        }
    }
    // range = Math.min(range, maxRange);

    // offset2 = 0;
    // for (let y = 0; y < height; y++) {
    //     for (let x = 0; x < width; x++) {
    //         encodeRGBM(pixels, offset2, range);
    //         offset2 += 4;
    //     }
    // }
    return {
        width : width,
        height : height,
        pixels : pixels
    };
}


export default parseRGBE;
