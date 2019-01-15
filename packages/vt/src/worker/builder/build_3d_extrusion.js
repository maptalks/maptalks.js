import { getIndexArrayType } from '../../common/Util';
import { buildExtrudeFaces } from './Extrusion';
import { buildUniqueVertex, buildFaceNormals, buildShadowVolume } from './Build';

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
            uv,
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
    faces.indices = new ctor(faces.indices);
    buffers.push(faces.indices.buffer);

    const uniqueFaces = buildUniqueVertex({ vertices : faces.vertices }, faces.indices, { 'vertices' : { size : 3 }});
    faces.vertices = uniqueFaces.vertices;
    // debugger
    if (normal || shadowVolume) {
        const normals = buildFaceNormals(faces.vertices, faces.indices);
        faces.normals = normals;
        buffers.push(normals.buffer);
    }
    if (tangent) {
        //TODO caculate tangent
    }
    if (uv) {
        buffers.push(faces.uvs.buffer);
    }
    if (shadowVolume) {
        const shadowVolume = buildShadowVolume(faces.vertices, oldIndices, faces.indices, faces.normals, faces.featureIndexes, shadowDir);
        faces.shadowVolume = shadowVolume;
        buffers.push(shadowVolume.vertices.buffer, shadowVolume.indices.buffer, shadowVolume.indexes.buffer);
    }
    return {
        data : faces,
        buffers
    };
}
