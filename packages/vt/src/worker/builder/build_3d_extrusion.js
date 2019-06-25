import { getIndexArrayType } from '../../common/Util';
import { buildExtrudeFaces } from './Extrusion';
import { buildUniqueVertex, buildShadowVolume } from './Build';
import { vec3, vec4 } from 'gl-matrix';
import { buildNormals, buildTangents, packTangentFrame } from '@maptalks/tbn-packer';

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
    const buffers = [];

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

    const uniqueFaces = buildUniqueVertex({ vertices : faces.vertices, featureIndexes: faces.featureIndexes }, indices, { 'vertices' : { size : 3 }, 'featureIndexes' : { size : 1 }});
    faces.vertices = uniqueFaces.vertices;
    faces.featureIndexes = uniqueFaces.featureIndexes;
    buffers.push(faces.vertices.buffer, faces.featureIndexes.buffer);

    // debugger
    if (tangent || normal || shadowVolume) {
        const normals = buildNormals(faces.vertices, indices);
        faces.normals = normals;
    }
    if (tangent) {
        let tangents = buildTangents(faces.vertices, faces.normals, faces.uvs, indices);
        tangents = createQuaternion(faces.normals, tangents);
        faces.tangents = tangents;
        buffers.push(tangents.buffer);
        //normal被封装在了tangents中
        delete faces.normals;
    }
    if (faces.normals) {
        faces.normals = new Float32Array(faces.normals);
        buffers.push(faces.normals.buffer);
    }
    if (faces.uvs) {
        buffers.push(faces.uvs.buffer);
    }
    if (shadowVolume) {
        const shadowVolume = buildShadowVolume(faces.vertices, oldIndices, indices, faces.normals, faces.featureIndexes, shadowDir);
        faces.shadowVolume = shadowVolume;
        buffers.push(shadowVolume.vertices.buffer, shadowVolume.indices.buffer, shadowVolume.indexes.buffer);
    }
    return {
        data : {
            data: {
                aPosition: faces.vertices,
                aNormal: faces.aNormal,
                aTexCoord0: faces.uvs,
                aTangent: faces.tangents,
                aPickingId: faces.featureIndexes,
            },
            indices
        },
        buffers
    };
}

function createQuaternion(normals, tangents) {
    const aTangent = new Float32Array(tangents.length);
    const t = [], n = [], q = [];
    for (let i = 0; i < tangents.length; i += 4) {
        const ni = i / 4 * 3;
        vec3.set(n, normals[ni], normals[ni + 1], normals[ni + 2]);
        vec4.set(t, tangents[i], tangents[i + 1], tangents[i + 2], tangents[i + 3]);
        packTangentFrame(q, n, t);
        vec4.copy(aTangent.subarray(i, i + 4), q);
    }
    return aTangent;
}
