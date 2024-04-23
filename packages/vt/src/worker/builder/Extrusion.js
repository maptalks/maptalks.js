import { fillPosArray, isClippedEdge } from './Common';
import { buildFaceUV, buildSideUV } from './UV';
import { isNumber, pushIn } from '../../common/Util';
import { PackUtil, ArrayPool, earcut } from '@maptalks/vector-packer';
import { KEY_IDX, PROP_OMBB } from '../../common/Constant';

export function buildExtrudeFaces(
    features, EXTENT,
    {
        altitudeScale, altitudeProperty, defaultAltitude, heightProperty, minHeightProperty, defaultHeight
    },
    {
        center,
        side,
        top,
        topThickness,
        uvOrigin,
        uv,
        uvSize,
        topUVMode,
        sideUVMode,
        sideVerticalUVMode,
        textureYOrigin,
        // vScale用于将meter转为gl point值
        // tileRatio = extent / tileSize
        tileRatio,
        // 厘米到tile point
        centimeterToPoint,
        verticalCentimeterToPoint,
        positionType,
        res,
        glScale,
        projectionCode
    },
    debugIndex, arrayPool
) {
    // debugger
    let scale = EXTENT / features[0].extent;
    if (EXTENT === Infinity) {
        scale = 1;
    }
    // Vector3DLayer下，需要反向的triangle
    const needReverseTriangle = EXTENT === Infinity;

    // const size = countVertexes(features) * 2;
    //featIndexes : index of indices for each feature
    // const arrCtor = getIndexArrayType(features.length);
    const featIndexes = arrayPool.get();
    const pickingIds = arrayPool.get();
    const featIds = arrayPool.get();
    const geoVertices = arrayPool.get();
    const vertices = arrayPool.get();
    const indices = arrayPool.get();
    const verticeTypes = arrayPool.get();
    const generateUV = !!uv,
        generateTop = !!top,
        generateSide = !!side;
    const uvs = generateUV ? arrayPool.get() : null;
    // const clipEdges = [];
    function fillData(start, offset, holes, height, ombb, needReverseTriangle) {
        let typeStartOffset = offset;
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
            if (needReverseTriangle) {
                for (let i = 2, l = triangles.length; i < l; i += 3) {
                    triangles[i] += start / 3;
                    triangles[i - 1] += start / 3;
                    triangles[i - 2] += start / 3;
                }
            } else {
                let tmp;
                for (let i = 2, l = triangles.length; i < l; i += 3) {
                    tmp = triangles[i - 1];
                    triangles[i - 1] = triangles[i] + start / 3;
                    triangles[i] = tmp + start / 3;
                    triangles[i - 2] += start / 3;
                }
            }

            //top face indices
            pushIn(indices, triangles);
            if (generateUV) {
                // debugger
                buildFaceUV(topUVMode || 0, start, offset, uvs, vertices, uvOrigin, centimeterToPoint, tileRatio, uvSize[0], uvSize[1], ombb, res, glScale, projectionCode, center);
            }

            if (topThickness > 0 && !generateSide) {
                offset = buildSide(vertices, geoVertices, holes, indices, offset, uvs, 0, topThickness, EXTENT, generateUV, sideUVMode || 0, sideVerticalUVMode || 0, textureYOrigin, uvSize, tileRatio, verticalCentimeterToPoint, needReverseTriangle);
            }
            verticeTypes.setLength(offset / 3);
            verticeTypes.fill(1, typeStartOffset / 3, offset / 3);
        }
        // debugger
        if (generateSide) {
            if (generateTop) {
                topThickness = 0;
            }
            typeStartOffset = offset;
            offset = buildSide(vertices, geoVertices, holes, indices, offset, uvs, topThickness, height, EXTENT, generateUV, sideUVMode || 0, sideVerticalUVMode || 0, textureYOrigin, uvSize, tileRatio, verticalCentimeterToPoint, needReverseTriangle);
            verticeTypes.setLength(offset / 3);
            const count = geoVertices.length / 3;
            verticeTypes.fill(1, typeStartOffset / 3, typeStartOffset / 3 + count);
            verticeTypes.fill(0, typeStartOffset / 3 + count, typeStartOffset / 3 + 2 * count);
            verticeTypes.fill(1, typeStartOffset / 3 + 2 * count, typeStartOffset / 3 + 3 * count);
            verticeTypes.fill(0, typeStartOffset / 3 + 3 * count, offset / 3);
        }
        return offset;
    }

    let maxAltitude = 0;
    let offset = 0;
    const BOUNDS = [-1, -1, EXTENT + 1, EXTENT + 1];

    let r = 0, n = features.length;
    if (isNumber(debugIndex)) {
        r = debugIndex;
        n = debugIndex + 1;
    }
    let maxFeaId = 0;
    let hasNegative = false;
    const holes = arrayPool.get();
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
        const ombb = feature.properties[PROP_OMBB];
        const isMultiOmbb = Array.isArray(ombb && ombb[0] && ombb[0][0]);
        let ringOmbb = isMultiOmbb ? ombb[0] : ombb;

        const { altitude, height } = PackUtil.getFeaAltitudeAndHeight(feature, altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight, minHeightProperty);
        maxAltitude = Math.max(Math.abs(altitude), maxAltitude);

        const verticeCount = vertices.length;

        let exteriorIndex = 0;
        let start = offset;
        holes.setLength(0);
        geoVertices.setLength(0);
        const shellIsClockwise = PackUtil.calculateSignedArea(geometry[0]) < 0;
        for (let i = 0, l = geometry.length; i < l; i++) {
            let ring = geometry[i];
            if (shellIsClockwise) {
                ring = ring.reverse();
            }
            ring = cleanVertices(ring);
            const isHole = PackUtil.calculateSignedArea(ring) < 0;
            //fill bottom vertexes
            if (!isHole && i > 0) {
                exteriorIndex++;
                ringOmbb = ombb && ombb[exteriorIndex];
                //an exterior ring (multi polygon)
                offset = fillData(start, offset, holes, height * scale, ringOmbb, needReverseTriangle, exteriorIndex); //need to multiply with scale as altitude is
                geoVertices.setLength(0);
                holes.setLength(0);
                start = offset;
            }
            if (EXTENT !== Infinity) {
                ring = PackUtil.clipPolygon(ring, BOUNDS);
            }
            if (!ring.length) {
                if (i === l - 1) {
                    offset = fillData(start, offset, holes, height * scale, ringOmbb, needReverseTriangle); //need to multiply with scale as altitude is
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
            fillPosArray(geoVertices, geoVertices.length, ring, scale, altitude, false, positionType);

            if (i === l - 1) {
                offset = fillData(start, offset, holes, height * scale, ringOmbb, needReverseTriangle); //need to multiply with scale as altitude is
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

    const data = {
        maxAltitude,
        vertices: vertices,        // vertexes
        verticeTypes,
        indices,                                    // indices for drawElements
        pickingIds: ArrayPool.createTypedArray(pickingIds, pickingCtor),   // vertex index of each feature
        featureIndexes: featIndexes
    };
    if (featIds.length) {
        const feaCtor = hasNegative ? PackUtil.getPosArrayType(maxFeaId) : PackUtil.getUnsignedArrayType(maxFeaId);
        data.featureIds = ArrayPool.createTypedArray(featIds, feaCtor);
    } else {
        data.featureIds = [];
    }
    if (uvs) {
        //因为vertices中最后一位不在indices中引用，uvs为保持位数与vertices一致，需补充2位
        uvs.setLength(vertices.length / 3 * 2);
        //改成int16
        data.uvs = uvs;
    }
    return data;
}

function buildSide(vertices, topVertices, holes, indices, offset, uvs, topThickness, height, EXTENT, generateUV, sideUVMode, sideVerticalUVMode, textureYOrigin, uvSize, tileRatio, verticalCentimeterToPoint, needReverseTriangle) {
    const count = topVertices.length;
    const startIdx = offset / 3;
    //拷贝两次top和bottom，是为了让侧面的三角形使用不同的端点，避免uv和normal值因为共端点产生错误
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
    //top vertexes
    // for (let i = 2, l = count; i < l; i += 3) {
    //     vertices[offset + i - 2] = topVertices[i - 2];
    //     vertices[offset + i - 1] = topVertices[i - 1];
    //     vertices[offset + i - 0] = topVertices[i] - topThickness;
    // }
    vertices.trySetLength(offset + count);
    vertices.copyWithin(offset, offset - 2 * count, offset - count);
    offset += count;
    //bottom vertexes
    vertices.trySetLength(offset + count);
    vertices.copyWithin(offset, offset - 2 * count, offset - count);
    // for (let i = 2, l = count; i < l; i += 3) {
    //     vertices[offset + i - 2] = topVertices[i - 2];
    //     vertices[offset + i - 1] = topVertices[i - 1];
    //     vertices[offset + i - 0] = topVertices[i] - height;
    // }
    offset += count;
    // vertices.trySetLength(offset);
    holes = holes || [];
    holes.push(count / 3);
    for (let r = 0; r < holes.length; r++) {
        // #287, 遍历geometry中的每个ring，构造侧面三角形和uv坐标
        const ringStart = startIdx + (holes[r - 1] || 0);
        const ringEnd = startIdx + holes[r];

        buildRingSide(ringStart, ringEnd, vertices, count / 3, EXTENT, indices,
            generateUV, sideUVMode, sideVerticalUVMode, textureYOrigin, uvs, uvSize, tileRatio, verticalCentimeterToPoint, needReverseTriangle);
    }
    return offset;
}

function buildRingSide(ringStart, ringEnd, vertices, vertexCount, EXTENT, indices,
    generateUV, sideUVMode, sideVerticalUVMode, textureYOrigin, uvs, uvSize, tileRatio, verticalCentimeterToPoint, needReverseTriangle) {
    const indiceStart = indices.length;
    let current, next;
    for (let i = ringStart, l = ringEnd; i < l - 1; i++) {
        current = i;
        next = i + 1;
        if (EXTENT !== Infinity && isClippedEdge(vertices, current, next, EXTENT)) {
            continue;
        }
        if ((i - ringStart) % 2 === 1) {
            //加上 2 * vertexCount，使用与 i % 2 === 0 时，不同的另一组端点，以避免共端点
            current += 2 * vertexCount;
            next += 2 * vertexCount;
        }

        if (!needReverseTriangle) {
            //bottom[i], top[i], top[i + 1]
            indices.push(current + vertexCount, current, next);
            //top[i + 1], bottom[i + 1],  bottom[i]
            indices.push(next, next + vertexCount, current + vertexCount);
        } else {
            indices.push(current + vertexCount, next, current);
            indices.push(next + vertexCount, next, current + vertexCount);
        }

    }
    if (generateUV) {
        buildSideUV(sideUVMode, sideVerticalUVMode, textureYOrigin, uvs, vertices, indices.slice(indiceStart, indices.length), uvSize[0], uvSize[1], tileRatio, verticalCentimeterToPoint, needReverseTriangle); //convert uvSize[1] to meter
    }
}

function cleanVertices(ring) {
    const result = [ring[0]];
    let currentVertice = ring[0];
    for (let i = 1; i < ring.length; i++) {
        if (Array.isArray(ring[i])) {
            if (ring[i][0] !== currentVertice[0] || ring[i][1] !== currentVertice[1] || ring[i][2] !== currentVertice[2]) {
                result.push(ring[i]);
            }
        } else {
            if (ring[i].x !== currentVertice.x || ring[i].y !== currentVertice.y || ring[i].z !== currentVertice.z) {
                result.push(ring[i]);
            }
        }
        currentVertice = ring[i];
    }
    return result;
}
