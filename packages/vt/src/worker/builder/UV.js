//inspired by https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
export function buildFaceUV(start, offset, uvs, vertices, texWidth, texHeight) {
    // debugger
    // for (let i = 0; i < indices.length; i++) {
    //     const ix = indices[i] * 3, iy = indices[i] * 3 + 1;
    //     const x = vertices[ix], y = vertices[iy];
    //     uvs.push(x / uvSize[0], y / uvSize[1]);
    // }

    //TODO 改为和面的方向垂直
    for (let i = start; i < start + offset; i += 3) {
        const idx = i / 3 * 2;
        const x = vertices[i], y = vertices[i + 1];
        uvs[idx] = x / texWidth;
        uvs[idx + 1] = y / texHeight;
    }
}

export function buildSideUV(uvs, vertices, indices, texWidth, texHeight) {
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
        const u = len / texWidth;
        const v = (z === maxz ? 0 : h / texHeight);
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
