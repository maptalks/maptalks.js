import { getIndexArrayType } from '../../common/Util';
import { buildExtrudeFaces } from './Extrusion';
import { buildUniqueVertex, buildFaceNormals, buildShadowVolume } from './Build';
import { vec3 } from 'gl-matrix';

export default function (features, dataConfig, extent, glScale, zScale, tileSize) {
    if (dataConfig.top === undefined) {
        dataConfig.top = true;
    }
    const {
        altitudeScale,
        altitudeProperty,
        defaultAltitude,
        heightProperty,
        defaultHeight,
        normal, tangent,
        uv, uvSize,
        shadowVolume, shadowDir,
        top
    } = dataConfig;
    const faces = buildExtrudeFaces(
        features, extent,
        {
            altitudeScale, altitudeProperty,
            defaultAltitude : defaultAltitude || 0,
            heightProperty,
            defaultHeight : defaultHeight || 0
        },
        {
            top,
            uv: uv || tangent, //tangent也需要计算uv
            uvSize : uvSize || [128, 128],
            //>> needed by uv computation
            glScale,
            //用于白模侧面的uv坐标v的计算
            // zScale用于将meter转为gl point值
            // (extent / tileSize)用于将gl point转为瓦片内坐标
            vScale : zScale * (extent / tileSize)
            //<<
        });
    const buffers = [faces.vertices.buffer, faces.featureIndexes.buffer];

    let oldIndices;
    if (shadowVolume) {
        oldIndices = faces.indices;
    }
    //in buildUniqueVertex, indices will be updated
    const l = faces.indices.length;
    const ctor = getIndexArrayType(l);
    const indices = new ctor(faces.indices);
    delete faces.indices;
    buffers.push(indices.buffer);

    const uniqueFaces = buildUniqueVertex({ vertices : faces.vertices }, indices, { 'vertices' : { size : 3 }});
    faces.vertices = uniqueFaces.vertices;
    // debugger
    if (normal || shadowVolume) {
        const normals = buildFaceNormals(faces.vertices, indices);
        faces.normals = normals;
        buffers.push(normals.buffer);
    }
    if (tangent) {
        const tangents = computeTangents(faces.vertices, faces.normals, faces.uvs, indices);
        faces.tangents = tangents;
        buffers.push(tangents.buffer);
    }
    if (uv) {
        buffers.push(faces.uvs.buffer);
    }
    if (shadowVolume) {
        const shadowVolume = buildShadowVolume(faces.vertices, oldIndices, indices, faces.normals, faces.featureIndexes, shadowDir);
        faces.shadowVolume = shadowVolume;
        buffers.push(shadowVolume.vertices.buffer, shadowVolume.indices.buffer, shadowVolume.indexes.buffer);
    }
    return {
        data : { data: faces, indices },
        buffers
    };
}


function computeTangents(positions, normals, uvs, indices) {
    const nVertices = positions.length / 3;

    const tangents = new Float32Array(4 * nVertices);

    const tan1 = [], tan2 = [];

    for (let i = 0; i < nVertices; i++) {

        tan1[ i ] = [0, 0, 0];
        tan2[ i ] = [0, 0, 0];

    }

    const vA = [0, 0, 0],
        vB = [0, 0, 0],
        vC = [0, 0, 0],

        uvA = [0, 0],
        uvB = [0, 0],
        uvC = [0, 0],

        sdir = [0, 0, 0],
        tdir = [0, 0, 0];

    function handleTriangle(a, b, c) {

        fromArray3(vA, positions, a * 3);
        fromArray3(vB, positions, b * 3);
        fromArray3(vC, positions, c * 3);

        fromArray2(uvA, uvs, a * 2);
        fromArray2(uvB, uvs, b * 2);
        fromArray2(uvC, uvs, c * 2);

        const x1 = vB[0] - vA[0];
        const x2 = vC[0] - vA[0];

        const y1 = vB[1] - vA[1];
        const y2 = vC[1] - vA[1];

        const z1 = vB[2] - vA[2];
        const z2 = vC[2] - vA[2];

        const s1 = uvB[0] - uvA[0];
        const s2 = uvC[0] - uvA[0];

        const t1 = uvB[1] - uvA[1];
        const t2 = uvC[1] - uvA[1];

        const r = 1.0 / (s1 * t2 - s2 * t1);

        vec3.set(
            sdir,
            (t2 * x1 - t1 * x2) * r,
            (t2 * y1 - t1 * y2) * r,
            (t2 * z1 - t1 * z2) * r
        );

        vec3.set(
            tdir,
            (s1 * x2 - s2 * x1) * r,
            (s1 * y2 - s2 * y1) * r,
            (s1 * z2 - s2 * z1) * r
        );

        vec3.add(tan1[ a ], tan1[ a ], sdir);
        vec3.add(tan1[ b ], tan1[ b ], sdir);
        vec3.add(tan1[ c ], tan1[ c ], sdir);

        vec3.add(tan2[ a ], tan2[ a ], tdir);
        vec3.add(tan2[ b ], tan2[ b ], tdir);
        vec3.add(tan2[ c ], tan2[ c ], tdir);

    }

    for (let j = 0, jl = indices.length; j < jl; j += 3) {

        handleTriangle(
            indices[ j + 0 ],
            indices[ j + 1 ],
            indices[ j + 2 ]
        );

    }

    const tmp = [], tmp2 = [];
    const n = [], n2 = [];
    let w, t, test;

    function handleVertex(v) {

        fromArray3(n, normals, v * 3);
        vec3.copy(n2, n);
        // n2.copy(n);

        t = tan1[ v ];

        // Gram-Schmidt orthogonalize

        vec3.copy(tmp, t);
        vec3.sub(tmp, tmp, vec3.scale(n, n, vec3.dot(n, t)));
        vec3.normalize(tmp, tmp);
        // tmp.sub(n.multiplyScalar(n.dot(t))).normalize();

        // Calculate handedness

        vec3.cross(tmp2, n2, t);
        test = vec3.dot(tmp2, tan2[ v ]);
        // tmp2.crossVectors(n2, t);
        // test = tmp2.dot(tan2[ v ]);
        w = (test < 0.0) ? -1.0 : 1.0;

        tangents[ v * 4 ] = tmp[0];
        tangents[ v * 4 + 1 ] = tmp[1];
        tangents[ v * 4 + 2 ] = tmp[2];
        tangents[ v * 4 + 3 ] = w;

    }

    for (let j = 0, jl = indices.length; j < jl; j += 3) {

        handleVertex(indices[ j + 0 ]);
        handleVertex(indices[ j + 1 ]);
        handleVertex(indices[ j + 2 ]);

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
