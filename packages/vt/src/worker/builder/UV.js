import computeOMBB from './Ombb.js';
import { vec2 } from 'gl-matrix';

//inspired by https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
export function buildOmbbUV(start, offset, uvs, vertices) {
    const obox = computeOMBB(vertices, start, offset);
    // console.log(obox);
    // debugger
    const idx = obox[4];
    const v0 = obox[idx];
    const v1 = obox[idx + 1];
    const v2 = obox[idx + 2];
    const kw = (v1[1] - v0[1]) / (v1[0] - v0[0]);
    const kh = (v2[1] - v1[1]) / (v2[0] - v1[0]);
    const w = vec2.distance(v0, v1);
    const h = vec2.distance(v1, v2);
    //为了提升精度，计算uvOrigin的小数部分
    // const uvStart = [(uvOrigin.x / texWidth) % 1, (uvOrigin.y / texHeight) % 1];
    for (let i = start; i < offset; i += 3) {
        const idx = i / 3 * 2;
        const x = vertices[i], y = vertices[i + 1];
        // uvs[idx] = uvStart[0] + (x * glScale) / texWidth;
        // uvs[idx + 1] = uvStart[1] + (y * glScale) / texHeight;

        uvs[idx] = cacAnchor(x, y, v0, kw, w);
        uvs[idx + 1] = cacAnchor(x, y, v1, kh, h);
    }
}

const V2 = [];
function cacAnchor(x, y, v, k, len) {
    V2[0] = (k * k * v[0] + k * (y - v[1]) + x) / (k * k + 1);
    V2[1] = k * (V2[0] - v[0]) + v[1];
    return vec2.distance(v, V2) / len;
}

export function buildFaceUV(start, offset, uvs, vertices, uvOrigin, glScale, texWidth, texHeight) {
    //为了提升精度，计算uvOrigin的小数部分
    const uvStart = [(uvOrigin.x / texWidth) % 1, (uvOrigin.y / texHeight) % 1];
    for (let i = start; i < offset; i += 3) {
        const idx = i / 3 * 2;
        const x = vertices[i], y = vertices[i + 1];
        uvs[idx] = uvStart[0] + (x * glScale) / texWidth;
        uvs[idx + 1] = uvStart[1] + (y * glScale) / texHeight;
    }
}

export function buildSideUV(uvs, vertices, indices, texWidth, texHeight, glScale, vScale) {
    let maxz = 0, minz = 0, h;
    let lensofar = 0;
    let prex, prey, seg = 0;
    for (let i = 0; i < indices.length; i++) {
        const ix = indices[i] * 3, iy = indices[i] * 3 + 1, iz = indices[i] * 3 + 2;
        const x = vertices[ix], y = vertices[iy], z = vertices[iz];
        if (!maxz && !minz) {
            maxz = Math.max(vertices[iz], vertices[indices[i + 3] * 3 + 2]);
            minz = Math.min(vertices[iz], vertices[indices[i + 3] * 3 + 2]);
            h = maxz - minz;
        }
        let len = lensofar;
        if (i > 0) {
            //每6个点构成一个矩形，其顺序如下：
            //  0 -- 2(3)
            //  |    |
            // 1(5)- 4
            const m = i % 6;
            if (m === 2) {
                seg = distanceTo(x, y, prex, prey);
            }
            if (m === 2 || m === 3 || m === 4) {
                len = lensofar + seg;
            } else if (m === 5) {
                lensofar += seg;
                len = lensofar - seg;
            }
        }
        const u = 1.0 - len * glScale / texWidth;
        const v = (z === maxz ? 0 : h * vScale / texHeight);
        uvs[ix / 3 * 2] = u;
        uvs[ix / 3 * 2 + 1] = v;
        prex = x;
        prey = y;
    }
}

/**
 * caculate 2 points' distance
 * @param {Number} x0 - x0
 * @param {Number} y0 - y0
 * @param {Number} x1 - x1
 * @param {Number} y1 - y1
 */
function distanceTo(x0, y0, x1, y1) {
    return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
}
