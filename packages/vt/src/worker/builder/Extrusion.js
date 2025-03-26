import { fillPosArray, isClippedEdge } from './Common';
import { buildFaceUV, buildSideUV } from './UV';
import { isNumber } from '../../common/Util';
import earcut from 'earcut';
import { KEY_IDX, PROP_OMBB } from '../../common/Constant';
import { getVectorPacker } from '../../packer/inject';

const { PackUtil, ArrayPool } = getVectorPacker();

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

    // !! 这里是危险区域，需要格外注意：
    // 2024年06月，为了提升arrayPool中数组的性能，arrayPool.get方法范围的数组不再使用Proxy对array进行包装，导致array.length不再返回array中的数据条数，而是数组本身的大小。
    // 所以使用该类数组时，需要使用 array.getLength() 才能返回正确的数据条数，而用 array.length 会返回错误的值

    const featIndexes = arrayPool.get();
    const pickingIds = arrayPool.get();
    const featIds = arrayPool.get();
    // arrayPool.getProxy() 返回的数组会用Proxy包装，其 .length 和 .getLength() 返回的值是一致的，但读取性能比 arrayPool.get() 返回的数组慢很多，多用于传递给第三方库作为参数（例如这里的earcut）
    const geoVertices = arrayPool.getProxy();
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
            // pushIn(vertices, geoVertices);
            let count = geoVertices.getLength();
            let index = vertices.currentIndex;
            for (let i = 0; i < count; i++) {
                vertices[index++] = geoVertices[i];
            }
            vertices.currentIndex = index;

            offset += geoVertices.getLength();
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
            // pushIn(indices, triangles);
            count = triangles.length;
            index = indices.currentIndex;
            for (let i = 0; i < count; i++) {
                indices[index++] = triangles[i];
            }
            indices.currentIndex = index;
            if (generateUV) {
                // debugger
                buildFaceUV(topUVMode || 0, start, offset, uvs, vertices, uvOrigin, centimeterToPoint, tileRatio, uvSize[0], uvSize[1], ombb, res, glScale, projectionCode, center);
            }

            if (topThickness > 0 && !generateSide) {
                const reverseSide = height < 0;
                offset = buildSide(vertices, geoVertices, holes, indices, offset, uvs, 0, topThickness, EXTENT, generateUV, sideUVMode || 0, sideVerticalUVMode || 0, textureYOrigin, uvSize, tileRatio, verticalCentimeterToPoint, reverseSide ? !needReverseTriangle : needReverseTriangle);
            }
            verticeTypes.setLength(offset / 3);
            verticeTypes.fill(1, typeStartOffset / 3, offset / 3);
        }
        // debugger
        if (generateSide) {
            if (generateTop) {
                topThickness = 0;
            }
            const reverseSide = height < 0;
            typeStartOffset = offset;
            offset = buildSide(vertices, geoVertices, holes, indices, offset, uvs, topThickness, height, EXTENT, generateUV, sideUVMode || 0, sideVerticalUVMode || 0, textureYOrigin, uvSize, tileRatio, verticalCentimeterToPoint, reverseSide ? !needReverseTriangle : needReverseTriangle);
            verticeTypes.setLength(offset / 3);
            const count = geoVertices.getLength() / 3;
            verticeTypes.fill(1, typeStartOffset / 3, typeStartOffset / 3 + count);
            verticeTypes.fill(0, typeStartOffset / 3 + count, typeStartOffset / 3 + 2 * count);
            verticeTypes.fill(1, typeStartOffset / 3 + 2 * count, typeStartOffset / 3 + 3 * count);
            verticeTypes.fill(0, typeStartOffset / 3 + 3 * count, offset / 3);
        }
        return offset;
    }

    let maxAltitude = -Infinity;
    let minAltitude = Infinity;
    let offset = 0;
    const BOUNDS = [-1, -1, EXTENT + 1, EXTENT + 1];

    let r = 0, n = features.length;
    if (isNumber(debugIndex)) {
        r = debugIndex;
        n = debugIndex + 1;
    }
    let maxFeaId = 0;
    let hasNegative = false;
    const holes = arrayPool.getProxy();
    let hasNegativeHeight = false;
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
        if (height < 0) {
            hasNegativeHeight = true;
            minAltitude = Math.min(altitude, minAltitude);
            maxAltitude = Math.max(altitude - height, maxAltitude);
        } else {
            maxAltitude = Math.max(altitude, maxAltitude);
            minAltitude = Math.min(altitude - height, minAltitude);
        }

        const verticeCount = vertices.getLength();

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
                let index = holes.currentIndex;
                holes[index++] = geoVertices.getLength() / 3;
                holes.currentIndex = index;
            }
            //a seg or a ring in line or polygon
            fillPosArray(geoVertices, geoVertices.getLength(), ring, scale, altitude, false, positionType);

            if (i === l - 1) {
                offset = fillData(start, offset, holes, height * scale, ringOmbb, needReverseTriangle); //need to multiply with scale as altitude is
            }
        }

        const count = vertices.getLength() - verticeCount;
        const keyName = (KEY_IDX + '').trim();
        for (let i = 0; i < count / 3; i++) {
            let index = pickingIds.currentIndex;
            pickingIds[index++] = feature[keyName] === undefined ? r : feature[keyName];
            pickingIds.currentIndex = index;

            index = featIndexes.currentIndex;
            featIndexes[index++] = r;
            featIndexes.currentIndex = index;

            // pickingIds.push(feature[keyName] === undefined ? r : feature[keyName]);
            // featIndexes.push(r);
            if (isNumber(feaId)) {
                index = featIds.currentIndex;
                featIds[index++] = feaId;
                featIds.currentIndex = index;
                // featIds.push(feaId);
            }
        }
    }
    const pickingCtor = PackUtil.getUnsignedArrayType(pickingIds.getLength() ? pickingIds[pickingIds.getLength() - 1] : 0);

    const data = {
        hasNegativeHeight,
        maxAltitude: maxAltitude === -Infinity ? 0 : maxAltitude,
        minAltitude: minAltitude === Infinity ? 0 : minAltitude,
        vertices: vertices,        // vertexes
        verticeTypes,
        indices,                                    // indices for drawElements
        pickingIds: ArrayPool.createTypedArray(pickingIds, pickingCtor),   // vertex index of each feature
        featureIndexes: featIndexes
    };
    if (featIds.getLength()) {
        const feaCtor = hasNegative ? PackUtil.getPosArrayType(maxFeaId) : PackUtil.getUnsignedArrayType(maxFeaId);
        data.featureIds = ArrayPool.createTypedArray(featIds, feaCtor);
    } else {
        data.featureIds = [];
    }
    if (uvs) {
        //因为vertices中最后一位不在indices中引用，uvs为保持位数与vertices一致，需补充2位
        uvs.setLength(vertices.getLength() / 3 * 2);
        //改成int16
        data.uvs = uvs;
    }
    return data;
}

function buildSide(vertices, topVertices, holes, indices, offset, uvs, topThickness, height, EXTENT, generateUV, sideUVMode, sideVerticalUVMode, textureYOrigin, uvSize, tileRatio, verticalCentimeterToPoint, needReverseTriangle) {
    const count = topVertices.getLength();
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
    const holeCount = holes.getLength();
    for (let r = 0; r < holeCount; r++) {
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
    const indiceStart = indices.getLength();
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
            let index = indices.currentIndex;
            //bottom[i], top[i], top[i + 1]
            indices[index++] = current + vertexCount;
            indices[index++] = current;
            indices[index++] = next;
            //top[i + 1], bottom[i + 1],  bottom[i]
            indices[index++] = next;
            indices[index++] = next + vertexCount;
            indices[index++] = current + vertexCount;

            indices.currentIndex = index;
            //bottom[i], top[i], top[i + 1]
            // indices.push(current + vertexCount, current, next);
            //top[i + 1], bottom[i + 1],  bottom[i]
            // indices.push(next, next + vertexCount, current + vertexCount);
        } else {
            let index = indices.currentIndex;
            //bottom[i], top[i], top[i + 1]
            indices[index++] = current + vertexCount;
            indices[index++] = next;
            indices[index++] = current;
            //top[i + 1], bottom[i + 1],  bottom[i]
            indices[index++] = next + vertexCount;
            indices[index++] = next;
            indices[index++] = current + vertexCount;

            indices.currentIndex = index;
            // indices.push(current + vertexCount, next, current);
            // indices.push(next + vertexCount, next, current + vertexCount);
        }

    }
    if (generateUV) {
        buildSideUV(sideUVMode, sideVerticalUVMode, textureYOrigin, uvs, vertices, indices, indiceStart, uvSize[0], uvSize[1], tileRatio, verticalCentimeterToPoint, needReverseTriangle); //convert uvSize[1] to meter
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
