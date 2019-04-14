const { vec3 } = maptalksgl;

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

    const tangents = computeTangents(vertices, normals, uvs, indices);

    return {
        vertices,
        textures : uvs,
        normals,
        tangents,
        indices
    };
}
//const sphere = createSphere(40, 20);
const sphere = SphereGeometry(2, 128, 128);

export default sphere;

function computeTangents( positions, normals, uvs, indices ) {

    // var index = geometry.index;
    // var attributes = geometry.attributes;

    // based on http://www.terathon.com/code/tangent.html
    // (per vertex tangents)

    // if ( index === null ||
    //      attributes.position === undefined ||
    //      attributes.normal === undefined ||
    //      attributes.uv === undefined ) {

    //     console.warn( 'THREE.BufferGeometry: Missing required attributes (index, position, normal or uv) in BufferGeometry.computeTangents()' );
    //     return;

    // }

    // var indices = index.array;
    // var positions = attributes.position.array;
    // var normals = attributes.normal.array;
    // var uvs = attributes.uv.array;

    var nVertices = positions.length / 3;

    // if ( attributes.tangent === undefined ) {

    //     // geometry.addAttribute( 'tangent', new THREE.BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );
    //     attributes['tangent', new Float32Array( 4 * nVertices )];
    //
    // }

    // var tangents = attributes.tangent.array;
    var tangents = new Array( 4 * nVertices );

    var tan1 = [], tan2 = [];

    for ( var i = 0; i < nVertices; i ++ ) {

        tan1[ i ] = [0, 0, 0];
        tan2[ i ] = [0, 0, 0];

    }

    var vA = [ 0, 0, 0 ],
        vB = [ 0, 0, 0 ],
        vC = [ 0, 0, 0 ],

        uvA = [ 0, 0 ],
        uvB = [ 0, 0 ],
        uvC = [ 0, 0 ],

        sdir = [ 0, 0, 0 ],
        tdir = [ 0, 0, 0 ];

    function handleTriangle( a, b, c ) {

        fromArray3( vA, positions, a * 3 );
        fromArray3( vB, positions, b * 3 );
        fromArray3( vC, positions, c * 3 );

        fromArray2( uvA, uvs, a * 2 );
        fromArray2( uvB, uvs, b * 2 );
        fromArray2( uvC, uvs, c * 2 );

        var x1 = vB[0] - vA[0];
        var x2 = vC[0] - vA[0];

        var y1 = vB[1] - vA[1];
        var y2 = vC[1] - vA[1];

        var z1 = vB[2] - vA[2];
        var z2 = vC[2] - vA[2];

        var s1 = uvB[0] - uvA[0];
        var s2 = uvC[0] - uvA[0];

        var t1 = uvB[1] - uvA[1];
        var t2 = uvC[1] - uvA[1];

        var r = 1.0 / ( s1 * t2 - s2 * t1 );

        vec3.set(
            sdir,
            ( t2 * x1 - t1 * x2 ) * r,
            ( t2 * y1 - t1 * y2 ) * r,
            ( t2 * z1 - t1 * z2 ) * r
        );

        vec3.set(
            tdir,
            ( s1 * x2 - s2 * x1 ) * r,
            ( s1 * y2 - s2 * y1 ) * r,
            ( s1 * z2 - s2 * z1 ) * r
        );

        vec3.add( tan1[ a ], tan1[ a ], sdir );
        vec3.add( tan1[ b ], tan1[ b ], sdir );
        vec3.add( tan1[ c ], tan1[ c ], sdir );

        vec3.add( tan2[ a ], tan2[ a ], tdir );
        vec3.add( tan2[ b ], tan2[ b ], tdir );
        vec3.add( tan2[ c ], tan2[ c ], tdir );

    }

    // var groups = geometry.groups;

    // if ( groups.length === 0 ) {

    //     groups = [ {
    //         start: 0,
    //         count: indices.length
    //     } ];

    // }


    for ( var j = 0, jl = indices.length; j < jl; j += 3 ) {

        handleTriangle(
            indices[ j + 0 ],
            indices[ j + 1 ],
            indices[ j + 2 ]
        );

    }



    var tmp =[], tmp2 =[];
    var n =[], n2 =[];
    var w, t, test;

    function handleVertex( v ) {

        fromArray3( n, normals, v * 3 );
        vec3.copy( n2, n );
        // n2.copy( n );

        t = tan1[ v ];

        // Gram-Schmidt orthogonalize

        vec3.copy( tmp, t );
        vec3.sub(tmp, tmp, vec3.scale(n, n, vec3.dot( n, t )));
        vec3.normalize(tmp, tmp);
        // tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

        // Calculate handedness

        vec3.cross(tmp2, n2, t);
        test = vec3.dot( tmp2, tan2[ v ] );
        // tmp2.crossVectors( n2, t );
        // test = tmp2.dot( tan2[ v ] );
        w = ( test < 0.0 ) ? - 1.0 : 1.0;

        tangents[ v * 4 ] = tmp[0];
        tangents[ v * 4 + 1 ] = tmp[1];
        tangents[ v * 4 + 2 ] = tmp[2];
        tangents[ v * 4 + 3 ] = w;

    }

    for ( var j = 0, jl = indices.length; j < jl; j += 3 ) {

        handleVertex( indices[ j + 0 ] );
        handleVertex( indices[ j + 1 ] );
        handleVertex( indices[ j + 2 ] );

    }



    return tangents;
}

function fromArray3(out, array, offset) {
    out[0] = array[offset];
    out[1] = array[offset + 1];
    out[2] = array[offset + 2];
    return out;
}

function fromArray2(out, array, offset) {
    out[0] = array[offset];
    out[1] = array[offset + 1];
    return out;
}
