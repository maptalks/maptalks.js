function createSphere(widthSegments, heightSegments, ) {
    //from claygl
    var vertexCount = (widthSegments + 1) * (heightSegments + 1);
    var positionAttr = new Array(vertexCount * 3);
    var texcoordAttr = new Array(vertexCount * 2);
    var normalAttr = new Array(vertexCount * 3);

    var indices = new Array(widthSegments * heightSegments * 6);

    var x, y, z,
        u, v,
        i, j;

    var radius = 1;
    var phiStart = 0;
    var phiLength = Math.PI * 2;
    var thetaStart = 0;
    var thetaLength = Math.PI;

    var pos = [];
    var uv = [];
    var offset = 0;
    var divider = 1 / radius;
    for (j = 0; j <= heightSegments; j ++) {
        for (i = 0; i <= widthSegments; i ++) {
            u = i / widthSegments;
            v = j / heightSegments;

            // X axis is inverted so texture can be mapped from left to right
            x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            y = radius * Math.cos(thetaStart + v * thetaLength);
            z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);

            const idx = offset * 3;
            positionAttr[idx] = x;
            positionAttr[idx + 1] = y;
            positionAttr[idx + 2] = z;
            texcoordAttr[offset * 2] = u;
            texcoordAttr[offset * 2 + 1] = v;
            normalAttr[idx] = x * divider;
            normalAttr[idx + 1] = y * divider;
            normalAttr[idx + 2] = z * divider;
            offset++;
        }
    }

    var i1, i2, i3, i4;

    var len = widthSegments + 1;

    var n = 0;
    for (j = 0; j < heightSegments; j ++) {
        for (i = 0; i < widthSegments; i ++) {
            i2 = j * len + i;
            i1 = (j * len + i + 1);
            i4 = (j + 1) * len + i + 1;
            i3 = (j + 1) * len + i;

            indices[n++] = i1;
            indices[n++] = i2;
            indices[n++] = i4;

            indices[n++] = i2;
            indices[n++] = i3;
            indices[n++] = i4;
        }
    }

    return {
        vertices : positionAttr,
        textures : texcoordAttr,
        normals : normalAttr,
        indices : indices
    }
}

const sphere = createSphere(40, 20);

export default sphere;
