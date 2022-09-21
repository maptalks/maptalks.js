import { fillPosArray, isClippedEdge } from './Common';
import { buildFaceUV, buildSideUV } from './UV';
import { isNumber, pushIn } from '../../common/Util';
import { PackUtil } from '@maptalks/vector-packer';
import earcut from 'earcut';
import { KEY_IDX } from '../../common/Constant';

export function buildExtrudeFaces(
    features, EXTENT,
    {
        altitudeScale, altitudeProperty, defaultAltitude, heightProperty, minHeightProperty, defaultHeight
    },
    {
        side,
        top,
        topThickness,
        uvOrigin,
        uv,
        uvSize,
        topUVMode,
        sideUVMode,
        glScale,
        // vScale用于将meter转为gl point值
        // localScale用于将gl point转为瓦片内坐标
        localScale,
        vScale
    },
    debugIndex
) {
    // debugger
    const scale = EXTENT / features[0].extent;

    // const size = countVertexes(features) * 2;
    //featIndexes : index of indices for each feature
    // const arrCtor = getIndexArrayType(features.length);
    const featIndexes = [];
    const pickingIds = [];
    const featIds = [];
    const geoVertices = [];
    const vertices = [];
    const indices = [];
    const generateUV = !!uv,
        generateTop = !!top,
        generateSide = !!side;
    const uvs = generateUV ? [] : null;
    // const clipEdges = [];
    function fillData(start, offset, holes, height) {
        //just ignore bottom faces never appear in sight
        if (generateTop) {
            const triangles = earcut(geoVertices, holes, 3); //vertices, holes, dimension(2|3)
            if (triangles.length === 0) {
                return offset;
            }
            //TODO caculate earcut deviation

            pushIn(vertices, geoVertices);
            offset += geoVertices.length;
            //switch triangle's i + 1 and i + 2 to make it ccw winding
            let tmp;
            for (let i = 2, l = triangles.length; i < l; i += 3) {
                tmp = triangles[i - 1];
                triangles[i - 1] = triangles[i] + start / 3;
                triangles[i] = tmp + start / 3;
                triangles[i - 2] += start / 3;
                // clipEdges.push(0, 0, 0);
            }

            //top face indices
            pushIn(indices, triangles);
            if (generateUV) {
                // debugger
                buildFaceUV(topUVMode || 0, start, offset, uvs, vertices, uvOrigin, glScale, localScale, uvSize[0], uvSize[1]);
            }

            if (topThickness > 0 && !generateSide) {
                offset = buildSide(vertices, geoVertices, holes, indices, offset, 0, topThickness, EXTENT, generateUV, sideUVMode || 0, uvs, uvSize, glScale, localScale, vScale);
            }
        }
        // debugger
        if (generateSide) {
            if (generateTop) {
                topThickness = 0;
            }
            offset = buildSide(vertices, geoVertices, holes, indices, offset, topThickness, height, EXTENT, generateUV, sideUVMode || 0, uvs, uvSize, glScale, localScale, vScale);
        }
        return offset;
    }

    let maxAltitude = 0;
    let offset = 0;
    const BOUNDS = [-1, -1, EXTENT + 1, EXTENT + 1];

    let r = 0, n = features.length;
    if (debugIndex !== undefined) {
        r = debugIndex;
        n = debugIndex + 1;
    }
    let maxFeaId = 0;
    let hasNegative = false;
    for (; r < n; r++) {
        const feature = features[r];
        const feaId = feature.id;
        if (isNumber(feaId)) {
            if (Math.abs(feaId) > maxFeaId) {
                maxFeaId = Math.abs(feaId);
            }
            if (feaId < 0) {
                hasNegative = true;
            }
        }

        const geometry = feature.geometry;

        const { altitude, height } = PackUtil.getFeaAltitudeAndHeight(feature, altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight, minHeightProperty);
        maxAltitude = Math.max(Math.abs(altitude), maxAltitude);

        const verticeCount = vertices.length;

        let start = offset;
        let holes = [];
        geoVertices.length = 0;
        for (let i = 0, l = geometry.length; i < l; i++) {
            const isHole = PackUtil.calculateSignedArea(geometry[i]) < 0;
            //fill bottom vertexes
            if (!isHole && i > 0) {
                //an exterior ring (multi polygon)
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
                geoVertices.length = 0;
                holes = [];
                start = offset;
            }
            let ring = geometry[i];
            if (EXTENT !== Infinity) {
                ring = PackUtil.clipPolygon(ring, BOUNDS);
            }
            if (!ring.length) {
                if (i === l - 1) {
                    offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
                }
                continue;
            }
            const ringLen = ring.length;
            if (Array.isArray(ring[0])) {
                if (ring[0][0] !== ring[ringLen - 1][0] || ring[0][1] !== ring[ringLen - 1][1]) {
                    //首尾不一样时，在末尾添加让首尾封闭
                    ring.push([ring[0][0], ring[0][1]]);
                }
            } else if (ring[0].x !== ring[ringLen - 1].x || ring[0].y !== ring[ringLen - 1].y) {
                //首尾不一样时，在末尾添加让首尾封闭
                ring.push(ring[0]);
            }
            if (isHole) {
                holes.push(geoVertices.length / 3);
            }
            //a seg or a ring in line or polygon
            fillPosArray(geoVertices, geoVertices.length, ring, scale, altitude);

            if (i === l - 1) {
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
            }
        }

        const count = vertices.length - verticeCount;
        const keyName = (KEY_IDX + '').trim();
        for (let i = 0; i < count / 3; i++) {
            pickingIds.push(feature[keyName] === undefined ? r : feature[keyName]);
            featIndexes.push(r);
            if (isNumber(feaId)) {
                featIds.push(feaId);
            }
        }
    }
    const pickingCtor = PackUtil.getUnsignedArrayType(pickingIds.length ? pickingIds[pickingIds.length - 1] : 0);
    const posArrayType = PackUtil.getPosArrayType(Math.max(512, maxAltitude));

    const data = {
        maxAltitude,
        vertices: new posArrayType(vertices),        // vertexes
        indices,                                    // indices for drawElements
        pickingIds: new pickingCtor(pickingIds),   // vertex index of each feature
        featureIndexes: featIndexes
    };
    if (featIds.length) {
        const feaCtor = hasNegative ? PackUtil.getPosArrayType(maxFeaId) : PackUtil.getUnsignedArrayType(maxFeaId);
        data.featureIds = new feaCtor(featIds);
    } else {
        data.featureIds = [];
    }
    if (uvs) {
        //因为vertices中最后一位不在indices中引用，uvs为保持位数与vertices一致，需补充2位
        uvs.length = vertices.length / 3 * 2;
        //改成int16
        data.uvs = uvs;
    }
    return data;
}

function buildSide(vertices, topVertices, holes, indices, offset, topThickness, height, EXTENT, generateUV, sideUVMode, uvs, uvSize, glScale, localScale, vScale) {
    const count = topVertices.length;
    const startIdx = offset / 3;
    //拷贝两次top和bottom，是为了让侧面的三角形使用不同的端点，避免uv和normal值因为共端点产生错误
    for (let i = 2, l = count; i < l; i += 3) {
        vertices[offset + i - 2] = topVertices[i - 2];
        vertices[offset + i - 1] = topVertices[i - 1];
        vertices[offset + i - 0] = topVertices[i] - topThickness;
    }
    offset += count;
    //bottom vertexes
    for (let i = 2, l = count; i < l; i += 3) {
        vertices[offset + i - 2] = topVertices[i - 2];
        vertices[offset + i - 1] = topVertices[i - 1];
        vertices[offset + i - 0] = topVertices[i] - height;
    }
    offset += count;
    //top vertexes
    for (let i = 2, l = count; i < l; i += 3) {
        vertices[offset + i - 2] = topVertices[i - 2];
        vertices[offset + i - 1] = topVertices[i - 1];
        vertices[offset + i - 0] = topVertices[i] - topThickness;
    }
    offset += count;
    //bottom vertexes
    for (let i = 2, l = count; i < l; i += 3) {
        vertices[offset + i - 2] = topVertices[i - 2];
        vertices[offset + i - 1] = topVertices[i - 1];
        vertices[offset + i - 0] = topVertices[i] - height;
    }
    offset += count;

    holes = holes || [];
    holes.push(count / 3);
    for (let r = 0; r < holes.length; r++) {
        // #287, 遍历geometry中的每个ring，构造侧面三角形和uv坐标
        const ringStart = startIdx + (holes[r - 1] || 0);
        const ringEnd = startIdx + holes[r];

        buildRingSide(ringStart, ringEnd, vertices, count / 3, EXTENT, indices, generateUV, sideUVMode, uvs, uvSize, glScale, localScale, vScale);
    }
    return offset;
}

function buildRingSide(ringStart, ringEnd, vertices, vertexCount, EXTENT, indices, generateUV, sideUVMode, uvs, uvSize, glScale, localScale, vScale) {
    const indiceStart = indices.length;
    let current, next;
    for (let i = ringStart, l = ringEnd; i < l - 1; i++) {
        current = i;
        next = i + 1;
        if (isClippedEdge(vertices, current, next, EXTENT)) {
            continue;
        }
        if ((i - ringStart) % 2 === 1) {
            //加上 2 * vertexCount，使用与 i % 2 === 0 时，不同的另一组端点，以避免共端点
            current += 2 * vertexCount;
            next += 2 * vertexCount;
        }
        //bottom[i], top[i], top[i + 1]
        indices.push(current + vertexCount, current, next);
        //top[i + 1], bottom[i + 1],  bottom[i]
        indices.push(next, next + vertexCount, current + vertexCount);
    }
    if (generateUV) {
        buildSideUV(sideUVMode, uvs, vertices, indices.slice(indiceStart, indices.length), uvSize[0], uvSize[1], glScale, localScale, vScale); //convert uvSize[1] to meter
    }
}
