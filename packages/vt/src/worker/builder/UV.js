import computeOMBB from './Ombb.js';
import { vec2 } from 'gl-matrix';

// 按照原来的uv计算时的缩放比例，计算的 meter 到 gl point 坐标的比例
const METER_TO_GL_POINT = 46.5;


export function buildFaceUV(mode, start, offset, uvs, vertices, uvOrigin, centimeterToPoint, localScale, texWidth, texHeight) {
    if (mode === 0) {
        buildFlatUV(start, offset, uvs, vertices, uvOrigin, centimeterToPoint, localScale, texWidth, texHeight);
    } else if (mode === 1) {
        buildOmbbUV(start, offset, uvs, vertices);
    }
}

//inspired by https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
function buildOmbbUV(start, offset, uvs, vertices) {
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
        uvs[idx + 1] = -cacAnchor(x, y, v1, kh, h);
    }
}

const V2 = [];
function cacAnchor(x, y, v, k, len) {
    V2[0] = (k * k * v[0] + k * (y - v[1]) + x) / (k * k + 1);
    V2[1] = k * (V2[0] - v[0]) + v[1];
    return vec2.distance(v, V2) / len;
}

function buildFlatUV(start, offset, uvs, vertices, uvOrigin, centimeterToPoint, localScale, texWidth, texHeight) {
    const pointToMeter = 1 / (centimeterToPoint * 100);
    //为了提升精度，计算uvOrigin的小数部分
    // console.log([(uvOrigin.x / texWidth), (uvOrigin.y / texHeight)]);
    // const uvStart = [(uvOrigin.x / texWidth) % 1, (uvOrigin.y / texHeight) % 1];
    const uvStart = [0, 0];
    for (let i = start; i < offset; i += 3) {
        const idx = i / 3 * 2;
        const x = vertices[i], y = vertices[i + 1];
        uvs[idx] = uvStart[0] + (x * pointToMeter / METER_TO_GL_POINT * localScale) / texWidth;
        uvs[idx + 1] = uvStart[1] - (y * pointToMeter / METER_TO_GL_POINT * localScale) / texHeight;
    }
}

export function buildSideUV(sideUVMode, sideVerticalUVMode, textureYOrigin, uvs, vertices, indices, texWidth, texHeight, localScale, centimeterToPoint) {
    let maxz = 0, minz = 0, h;
    let lensofar = 0;
    let seg = 0;
    //因为是逆时针，需要倒序遍历
    for (let i = indices.length - 1; i >= 0; i--) {
        const idx = indices[i];
        const ix = idx * 3, iy = idx * 3 + 1, iz = idx * 3 + 2;
        const x = vertices[ix], y = vertices[iy], z = vertices[iz];
        if (!maxz && !minz) {
            maxz = Math.max(vertices[iz], vertices[indices[i - 2] * 3 + 2]);
            minz = Math.min(vertices[iz], vertices[indices[i - 2] * 3 + 2]);
            h = maxz - minz;
        }
        let len = lensofar;
        const m = i % 6;
        //每6个点构成一个矩形，其顺序如下：
        //  1 -- 2(3)
        //  |    |
        // 0(5)- 4
        if (sideUVMode === 0) {
            //连续
            if (m === 5) {
                seg = getSegLength(vertices, indices, i, x, y);
            }
            if (m === 2 || m === 3 || m === 4) {
                len = lensofar;
            } else {
                len = lensofar + seg;
            }
        } else if (sideUVMode === 1) {
            if (m === 2 || m === 3 || m === 4) {
                len = 0;
            } else if (m === 5) {
                seg = getSegLength(vertices, indices, i, x, y);
                len = seg;
            } else {
                len = seg;
            }
        }

        // len * glScale = gl point， localScale = tileSize / extent
        const pointToMeter = 1 / (centimeterToPoint * 100);
        const u = len * localScale * pointToMeter / METER_TO_GL_POINT / texWidth; //0 ? 1.0 - len * glScale / texWidth :
        // const u = len * localScale * glScale / texWidth;
        let v;

        if (sideVerticalUVMode === 1) {
            // 垂直平铺
            // https://github.com/maptalks/issues/issues/294
            v = z === maxz ? 1 : 0;
        } else {
            if (textureYOrigin === 'bottom') {
                v = (z === maxz ? h / METER_TO_GL_POINT / texHeight : 0);
            } else {
                v = (z === maxz ? 0 : h / METER_TO_GL_POINT / texHeight);
            }
        }

        uvs[idx * 2] = u;
        uvs[idx * 2 + 1] = v;

        if (m === 0) {
            lensofar += seg;
        }
        // prex = x;
        // prey = y;
    }
}

function getSegLength(vertices, indices, i, x, y) {
    const ix = indices[i - 1] * 3, iy = indices[i - 1] * 3 + 1;
    const nextx = vertices[ix], nexty = vertices[iy];
    return distanceTo(x, y, nextx, nexty);
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
