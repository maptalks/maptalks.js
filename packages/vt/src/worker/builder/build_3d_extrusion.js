import { getIndexArrayType } from '../../common/Util';
import { buildExtrudeFaces } from './Extrusion';
// import { buildUniqueVertex, buildShadowVolume } from './Build';
import { vec3, vec4 } from 'gl-matrix';
import { buildNormals, buildTangents, packTangentFrame } from '@maptalks/tbn-packer';
import { isFunctionDefinition, interpolated, piecewiseConstant } from '@maptalks/function-type';
import Color from 'color';
import { PACK_TEX_SIZE } from '@maptalks/vector-packer';

export default function (features, dataConfig, extent, uvOrigin, glScale, zScale, localScale, symbol, zoom, debugIndex) {
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
        minHeightProperty,
        defaultHeight,
        tangent,
        uv, uvScale,
        topUVMode,
        sideUVMode,
        top, side,
        topThickness,
    } = dataConfig;
    //256是2的8次方，在glZoom + 8级别时，texture为1:1比例
    const textureSize = PACK_TEX_SIZE;
    const faces = buildExtrudeFaces(
        features, extent,
        {
            altitudeScale, altitudeProperty,
            defaultAltitude : defaultAltitude || 0,
            heightProperty,
            minHeightProperty,
            defaultHeight : defaultHeight || 0
        },
        {
            top, side,
            topThickness: topThickness * 10 || 0,
            uv: uv || tangent, //tangent也需要计算uv
            uvSize: uvScale ? [textureSize * uvScale[0], textureSize  * uvScale[1]] : [textureSize, textureSize],
            uvOrigin,
            topUVMode,
            sideUVMode,
            //>> needed by uv computation
            glScale: glScale * localScale,
            //用于白模侧面的uv坐标v的计算
            // zScale用于将meter转为gl point值
            // localScale用于将gl point转为瓦片内坐标
            vScale: zScale
            //<<
        }, debugIndex);
    const buffers = [];
    const ctor = getIndexArrayType(faces.vertices.length / 3);
    const indices = new ctor(faces.indices);
    delete faces.indices;
    buffers.push(indices.buffer, faces.vertices.buffer, faces.featureIndexes.buffer);

    const normals = buildNormals(faces.vertices, indices);
    let simpleNormal = true;
    //因为aPosition中的数据是在矢量瓦片坐标体系里的，y轴和webgl坐标体系相反，所以默认计算出来的normal是反的
    for (let i = 0; i < normals.length; i++) {
        normals[i] = -normals[i];
        if (normals[i] % 1 !== 0) {
            simpleNormal = false;
        }
    }
    faces.normals = normals;

    if (tangent) {
        let tangents = buildTangents(faces.vertices, faces.normals, faces.uvs, indices);
        tangents = createQuaternion(faces.normals, tangents);
        faces.tangents = tangents;
        buffers.push(tangents.buffer);
        //normal被封装在了tangents中
        delete faces.normals;
    }
    if (faces.normals) {
        //如果只有顶面，normal数据只有0, 1, -1时，则为simple normal，可以改用Int8Array
        if (simpleNormal) {
            faces.normals = new Int8Array(faces.normals);
        } else {
            faces.normals = new Float32Array(faces.normals);
        }

        buffers.push(faces.normals.buffer);
    }
    if (faces.uvs) {
        const uvs = faces.uvs;
        faces.uvs = new Float32Array(uvs);
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
            indices,
            properties: {
                maxAltitude: faces.maxAltitude
            }
        },
        buffers
    };
    if (faces.featureIds) {
        data.data.featureIds = faces.featureIds;
        buffers.push(data.data.featureIds.buffer);
    }
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
        vec3.set(n, normals[ni] || 0, normals[ni + 1] || 0, normals[ni + 2] || 0);
        vec4.set(t, tangents[i] || 0, tangents[i + 1] || 0, tangents[i + 2] || 0, tangents[i + 3] || 0);
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
