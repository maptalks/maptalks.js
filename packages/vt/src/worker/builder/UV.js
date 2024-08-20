import { vec2 } from 'gl-matrix';
import { project } from './projection.js';

// 按照原来的uv计算时的缩放比例，计算的 meter 到 gl point 坐标的比例
// export const METER_TO_GL_POINT = 46.5;


export function buildFaceUV(mode, start, offset, uvs, vertices, uvOrigin, centimeterToPoint, tileRatio, texWidth, texHeight, ombb, res, glScale, projectionCode, center) {
    if (mode === 0) {
        buildFlatUV(start, offset, uvs, vertices, uvOrigin, centimeterToPoint, tileRatio, texWidth, texHeight, center);
    } else if (mode === 1) {
        buildOmbbUV(ombb, start, offset, uvs, vertices, uvOrigin, tileRatio, res, glScale, projectionCode, !!center);
    }
}

//inspired by https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
function buildOmbbUV(obox, start, offset, uvs, vertices, uvOrigin, tileRatio, res, glScale, projectionCode, isExtrudePolygonLayer) {
    if (!obox) {
        return;
    }
    const idx = obox[4];
    let v0, v1, v2, v3;
    if (idx === 0) {
        v0 = obox[0];
        v1 = obox[1];
        v2 = obox[2];
        v3 = obox[3];
    } else {
        v0 = obox[1];
        v1 = obox[2];
        v2 = obox[3];
        v3 = obox[0];
    }
    // 长边
    const w = vec2.distance(v0, v1);
    const h = vec2.distance(v1, v2);

    const pt = [];
    const perpX = [];
    const perpY = [];

    //为了提升精度，计算uvOrigin的小数部分
    for (let i = start; i < offset; i += 3) {
        const idx = i / 3 * 2;
        const x = (uvOrigin.x / glScale + vertices[i] / tileRatio) * res;
        const y = uvOrigin.y / glScale * res + (isExtrudePolygonLayer ? vertices[i + 1] : -vertices[i + 1]) / tileRatio * res;
        vec2.set(pt, x, y);
        if (projectionCode === 'EPSG:4326' || projectionCode === 'EPSG:4490') {
            project(pt, pt, 'EPSG:3857');
        }
        getFootOfPerpendicular(perpX, pt, v0, v1);
        getFootOfPerpendicular(perpY, pt, v3, v0);
        uvs[idx] = vec2.distance(v0, perpX) / w;
        uvs[idx + 1] = vec2.distance(v0, perpY) / h;
    }
}

function getFootOfPerpendicular(
    out,
    pt,     // 直线外一点
    begin,  // 直线开始点
    end)   // 直线结束点
{

    const dx = begin[0] - end[0];
    const dy = begin[1] - end[1];

    let u = (pt[0] - begin[0]) * (begin[0] - end[0]) +
        (pt[1] - begin[1]) * (begin[1] - end[1]);
    u = u / ((dx * dx)+(dy * dy));

    out[0] = begin[0] + u * dx;
    out[1] = begin[1] + u * dy;

    return out;
}

function buildFlatUV(start, offset, uvs, vertices, uvOrigin, centimeterToPoint, tileRatio, texWidth, texHeight, center) {
    const xPointToMeter = 1 / (centimeterToPoint[0] * 100);
    const yPointToMeter = 1 / (centimeterToPoint[1] * 100);
    //为了提升精度，计算uvOrigin的小数部分
    // console.log([(uvOrigin.x / texWidth), (uvOrigin.y / texHeight)]);
    // const uvStart = [(uvOrigin.x / texWidth) % 1, (uvOrigin.y / texHeight) % 1];
    const centerX = (center && center[0] || 0);
    const centerY = (center && center[1] || 0);
    const uvStart = [0, 0];
    for (let i = start; i < offset; i += 3) {
        const idx = i / 3 * 2;
        const x = vertices[i] - centerX;
        const y = vertices[i + 1] - centerY;
        uvs[idx] = uvStart[0] + (x / tileRatio * xPointToMeter) / texWidth;
        uvs[idx + 1] = uvStart[1] - (y / tileRatio * yPointToMeter) / texHeight;
    }
}

export function buildSideUV(sideUVMode, sideVerticalUVMode, textureYOrigin, uvs, vertices, indices, indiceStart, texWidth, texHeight, tileRatio, verticalCentimeterToPoint, needReverseTriangle) {
    let maxz = 0, minz = 0, h;
    let lensofar = 0;
    let seg = 0;

    const segStart = 5;
    const segEnd = needReverseTriangle ? [1, 3, 4] : [2, 3, 4];
    //因为是逆时针，需要倒序遍历
    const count = indices.getLength();
    for (let i = count - 1; i >= indiceStart; i--) {
        const idx = indices[i];
        const ix = idx * 3, iy = idx * 3 + 1, iz = idx * 3 + 2;
        const x = vertices[ix], y = vertices[iy], z = vertices[iz];
        if (!maxz && !minz) {
            maxz = Math.max(vertices[iz], vertices[indices[i - 3] * 3 + 2]);
            minz = Math.min(vertices[iz], vertices[indices[i - 3] * 3 + 2]);
            h = maxz - minz;
        }
        let len = lensofar;
        const m = i % 6;
        //每6个点构成一个矩形，其顺序如下：
        //  1 -- 2(3)
        //  |    |
        // 0(5)- 4
        // 如果是needReverseTriangle
        //  2 -- 1(4)
        //  |    |
        // 0(5)- 3
        if (sideUVMode === 0) {
            //连续
            if (m === segStart) {
                seg = getSegLength(vertices, indices, i, x, y);
            }
            if (m === segEnd[0] || m === segEnd[1] || m === segEnd[2]) {
                len = lensofar;
            } else {
                len = lensofar + seg;
            }
        } else if (sideUVMode === 1) {
            if (m === segEnd[0] || m === segEnd[1] || m === segEnd[2]) {
                len = 0;
            } else if (m === segStart) {
                seg = getSegLength(vertices, indices, i, x, y);
                len = seg;
            } else {
                len = seg;
            }
        }

        // len * glScale = gl point， tileRatio = extent / tileSize
        const pointToMeter = 1 / (verticalCentimeterToPoint * 100);
        const u = len / tileRatio * pointToMeter / texWidth; //0 ? 1.0 - len * glScale / texWidth :
        // const u = len * tileRatio * glScale / texWidth;
        let v;

        if (sideVerticalUVMode === 1) {
            // 垂直平铺
            // https://github.com/maptalks/issues/issues/294
            v = z === maxz ? 1 : 0;
        } else {
            if (textureYOrigin === 'bottom') {
                // 除以 100 是从厘米转换为米
                v = (z === maxz ? h / 100 / texHeight : 0);
            } else {
                v = (z === maxz ? 0 : -h / 100 / texHeight);
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
