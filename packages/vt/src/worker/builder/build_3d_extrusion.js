import { getIndexArrayType } from '../../common/Util';
import { buildExtrudeFaces } from './Extrusion';
// import { buildUniqueVertex, buildShadowVolume } from './Build';
import { vec3, vec4 } from 'gl-matrix';
import { buildNormals, buildTangents, packTangentFrame } from '@maptalks/tbn-packer';
import { isFunctionDefinition, interpolated, piecewiseConstant } from '@maptalks/function-type';
import Color from 'color';

export default function (features, dataConfig, extent, glScale, zScale, tileSize, symbol, zoom) {
    if (dataConfig.top === undefined) {
        dataConfig.top = true;
    }
    if (dataConfig.side === undefined) {
        dataConfig.side = true;
    }
    const {
        altitudeScale,
        altitudeProperty,
        defaultAltitude,
        heightProperty,
        defaultHeight,
        tangent,
        uv, uvScale,
        top, side,
        topThickness,
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
            top, side,
            topThickness: topThickness || 0,
            uv: uv || tangent, //tangent也需要计算uv
            uvSize: uvScale ? [128 * uvScale[0], 128 * uvScale[1]] : [128, 128],
            //>> needed by uv computation
            glScale: glScale * (extent / tileSize),
            //用于白模侧面的uv坐标v的计算
            // zScale用于将meter转为gl point值
            // (extent / tileSize)用于将gl point转为瓦片内坐标
            vScale: zScale * (extent / tileSize) * (extent / tileSize)
            //<<
        });
    const buffers = [];

    //in buildUniqueVertex, indices will be updated
    const l = faces.indices.length;
    const ctor = getIndexArrayType(l);
    const indices = new ctor(faces.indices);
    delete faces.indices;
    buffers.push(indices.buffer, faces.vertices.buffer, faces.featureIndexes.buffer);

    // debugger
    const normals = buildNormals(faces.vertices, indices);
    for (let i = 0; i < normals.length; i++) {
        normals[i] = -normals[i];
    }
    faces.normals = normals;

    if (tangent) {
        let tangents = buildTangents(faces.vertices, faces.normals, faces.uvs, indices);
        const len = tangents.length;
        if (tangents[len - 1] === undefined) {
            tangents[len - 4] = tangents[0];
            tangents[len - 3] = tangents[1];
            tangents[len - 2] = tangents[2];
            tangents[len - 1] = tangents[3];
        }
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
    const fnTypes = buildFnTypes(features, symbol, zoom, faces.featureIndexes);
    const data =  {
        data : {
            data: {
                aPosition: faces.vertices,
                aNormal: faces.normals,
                aTexCoord0: faces.uvs,
                aTangent: faces.tangents,
                aPickingId: faces.featureIndexes,
            },
            indices
        },
        buffers
    };
    if (fnTypes.aColor) {
        data.data.data.aColor = fnTypes.aColor;
        data.buffers.push(fnTypes.aColor.buffer);
    }
    if (fnTypes.aOpacity) {
        data.data.data.aOpacity = fnTypes.aOpacity;
        data.buffers.push(fnTypes.aOpacity.buffer);
    }
    return data;
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

function buildFnTypes(features, symbol, zoom, pickingIds) {
    const fnTypes = {};
    if (isFnTypeSymbol('polygonFill', symbol)) {
        const colorCache = {};
        const colorFn = piecewiseConstant(symbol.polygonFill);
        const aColor = new Uint8Array(pickingIds.length * 4);
        for (let i = 0; i < pickingIds.length; i++) {
            const feature = features[pickingIds[i]];
            let color = colorFn(zoom, feature.properties);
            if (!Array.isArray(color)) {
                color = colorCache[color] = colorCache[color] || Color(color).array();
            }
            if (color.length === 3) {
                color.push(255);
            }
            aColor[i * 4] = color[0];
            aColor[i * 4 + 1] = color[1];
            aColor[i * 4 + 2] = color[2];
            aColor[i * 4 + 3] = color[3];
        }
        fnTypes.aColor = aColor;
    }
    if (isFnTypeSymbol('polygonOpacity', symbol)) {
        const opacityFn = interpolated(symbol.polygonOpacity);
        const aOpacity = new Uint8Array(pickingIds.length);
        for (let i = 0; i < pickingIds.length; i++) {
            const feature = features[pickingIds[i]];
            const opacity = opacityFn(zoom, feature.properties);
            aOpacity[i] = opacity * 255;
        }
        fnTypes.aOpacity = aOpacity;
    }
    return fnTypes;
}

function isFnTypeSymbol(name, symbolDef) {
    return isFunctionDefinition(symbolDef[name]) && symbolDef[name].property;
}
