//inspired by https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
export function buildFaceUV(uvs, vertices, indices, uvSize) {
    // debugger
    //TODO 改为和面的方向垂直
    for (let i = 0; i < indices.length; i++) {
        const ix = indices[i] * 3, iy = indices[i] * 3 + 1;
        const x = vertices[ix], y = vertices[iy];
        uvs.push(x / uvSize[0], y / uvSize[1]);
    }
}

export function buildSideUV(uvs, vertices, indices, uvSize) {
    // debugger
    let maxz = 0, minz = 0, h;
    let lensofar = 0;
    let prex, prey;
    for (let i = 0; i < indices.length; i++) {
        const ix = indices[i] * 3, iy = indices[i] * 3 + 1, iz = indices[i] * 3 + 2;
        const x = vertices[ix], y = vertices[iy], z = vertices[iz];
        if (!maxz && !minz) {
            maxz = Math.max(vertices[iz], vertices[indices[i + 3] * 3 + 2]);
            minz = Math.min(vertices[iz], vertices[indices[i + 3] * 3 + 2]);
            h = maxz - minz;
        }
        if (i > 0) {
            lensofar += distanceTo(x, y, prex, prey);
        }
        const u = lensofar / uvSize[0],
            v = (z === maxz ? 0 : h / uvSize[1]);
        uvs.push(u, v);
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
