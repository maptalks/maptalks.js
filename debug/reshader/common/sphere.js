function createSphere(widthSegments, heightSegments,) {
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
    for (j = 0; j <= heightSegments; j++) {
        for (i = 0; i <= widthSegments; i++) {
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
    for (j = 0; j < heightSegments; j++) {
        for (i = 0; i < widthSegments; i++) {
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
    };
}
function SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {
    radius = radius || 1;
    widthSegments = Math.max(3, Math.floor(widthSegments) || 8);
    heightSegments = Math.max(2, Math.floor(heightSegments) || 6);
    phiStart = phiStart !== undefined ? phiStart : 0;
    phiLength = phiLength !== undefined ? phiLength : Math.PI * 2;
    thetaStart = thetaStart !== undefined ? thetaStart : 0;
    thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;
    var thetaEnd = thetaStart + thetaLength;
    var ix, iy;
    var index = 0;
    var grid = [];
    var vertex = [];
    var normal = [];
    // buffers
    var indices = [];
    var vertices = [];
    var normals = [];
    var uvs = [];
    // generate vertices, normals and uvs
    for (iy = 0; iy <= heightSegments; iy++) {
        var verticesRow = [];
        var v = iy / heightSegments;
        // special case for the poles
        var uOffset = ((iy === 0) ? 0.5 / widthSegments : (iy === heightSegments)) ? -0.5 / widthSegments : 0;
        for (ix = 0; ix <= widthSegments; ix++) {
            var u = ix / widthSegments;
            // vertex
            vertex[0] = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            vertex[1] = radius * Math.cos(thetaStart + v * thetaLength);
            vertex[2] = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
            vertices.push(vertex[0], vertex[1], vertex[2]);
            // normal
            normal[0] = vertex[0];
            normal[1] = vertex[1];
            normal[2] = vertex[2];
            // .normalize();
            var length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]) || 1;
            normal[0] = normal[0] / length;
            normal[1] = normal[1] / length;
            normal[2] = normal[2] / length;
            normals.push(normal[0], normal[1], normal[2]);
            // uv
            uvs.push(u + uOffset, 1 - v);
            verticesRow.push(index++);
        }
        grid.push(verticesRow);
    }
    // indices
    for (iy = 0; iy < heightSegments; iy++) {
        for (ix = 0; ix < widthSegments; ix++) {
            var a = grid[ iy ][ ix + 1 ];
            var b = grid[ iy ][ ix ];
            var c = grid[ iy + 1 ][ ix ];
            var d = grid[ iy + 1 ][ ix + 1 ];
            if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
            if (iy !== heightSegments - 1 || thetaEnd < Math.PI) indices.push(b, c, d);
        }
    }

    return {
        vertices,
        textures : uvs,
        normals,
        indices
    };
}
//const sphere = createSphere(40, 20);
const sphere = SphereGeometry(2, 128, 128);

export default sphere;
