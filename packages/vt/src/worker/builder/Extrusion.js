import { fillPosArray, isClippedEdge } from './Common';
import { buildFaceUV, buildSideUV } from './UV';
import { pushIn, getUnsignedArrayType, getPosArrayType } from '../../common/Util';
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
        glScale,
        vScale //用于将meter转化为矢量瓦片内的坐标值
    }
) {
    // debugger
    const scale = EXTENT / features[0].extent;

    // const size = countVertexes(features) * 2;
    //featIndexes : index of indices for each feature
    // const arrCtor = getIndexArrayType(features.length);
    const featIndexes = [];
    const vertices = [];
    const indices = [];
    const generateUV = !!uv,
        generateTop = !!top,
        generateSide = !!side;
    const uvs = generateUV ? [] : null;
    // const clipEdges = [];
    function fillData(start, offset, holes, height) {
        const top = vertices.slice(start, offset);

        //just ignore bottom faces never appear in sight
        if (generateTop) {
            const triangles = earcut(top, holes, 3); //vertices, holes, dimension(2|3)
            if (triangles.length === 0) {
                return offset;
            }
            //TODO caculate earcut deviation

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
                buildFaceUV(start, offset, uvs, vertices, uvOrigin, glScale, uvSize[0], uvSize[1]);
            }

            if (topThickness > 0) {
                offset = buildSide(vertices, top, holes, indices, start, offset, 0, topThickness, EXTENT, generateUV, uvs, uvSize, glScale, vScale);
            }
        }
        // debugger
        if (generateSide && height > 0 && topThickness < height) {
            offset = buildSide(vertices, top, holes, indices, start, offset, topThickness, height, EXTENT, generateUV, uvs, uvSize, glScale, vScale);
        }
        return offset;
    }
    // debugger
    let maxAltitude = 0;
    let offset = 0;
    const BOUNDS = [-1, -1, EXTENT + 1, EXTENT + 1];

    for (let r = 0, n = features.length; r < n; r++) {
        const feature = features[r];
        const geometry = feature.geometry;

        const altitudeValue = PackUtil.getHeightValue(feature.properties, altitudeProperty, defaultAltitude);
        const altitude = altitudeValue * altitudeScale;
        maxAltitude = Math.max(Math.abs(altitude), maxAltitude);
        let height = altitudeValue;
        if (heightProperty) {
            height = PackUtil.getHeightValue(feature.properties, heightProperty, defaultHeight);
        } else if (minHeightProperty) {
            height = altitudeValue - PackUtil.getHeightValue(feature.properties, minHeightProperty, 0);
        }
        height *= altitudeScale;

        const verticeCount = vertices.length;

        let start = offset;
        let holes = [];

        for (let i = 0, l = geometry.length; i < l; i++) {
            const isHole = PackUtil.calculateSignedArea(geometry[i]) < 0;
            //fill bottom vertexes
            if (!isHole && i > 0) {
                //an exterior ring (multi polygon)
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
                holes = [];
                start = offset;
            }
            const segStart = offset - start;
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

            //a seg or a ring in line or polygon
            offset = fillPosArray(vertices, offset, ring, scale, altitude);
            if (isHole) {
                holes.push(segStart / 3);
            }
            if (i === l - 1) {
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
            }
        }

        const count = vertices.length - verticeCount;
        for (let i = 0; i < count / 3; i++) {
            featIndexes.push(feature[KEY_IDX] || r);
        }
    }
    const feaCtor = getUnsignedArrayType(featIndexes.length ? featIndexes[featIndexes.length - 1] : 0);
    const posArrayType = getPosArrayType(Math.max(512, maxAltitude));

    const data = {
        maxAltitude,
        vertices: new posArrayType(vertices),        // vertexes
        indices,                                    // indices for drawElements
        featureIndexes: new feaCtor(featIndexes)   // vertex index of each feature
    };
    if (uvs) {
        //可以改成int16
        data.uvs = new Float32Array(uvs);
    }
    return data;
}

function buildSide(vertices, topVertices, holes, indices, start, offset, topThickness, height, EXTENT, generateUV, uvs, uvSize, glScale, vScale) {
    const count = offset - start;
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

    //side face indices
    const s = indices.length;
    const startIdx = (start + count) / 3;
    const vertexCount = count / 3;
    let ringStartIdx = startIdx, current, next;
    for (let i = startIdx, l = vertexCount + startIdx; i < l - 1; i++) {
        current = i;
        if (holes.indexOf(i - startIdx + 1) >= 0) {
            next = ringStartIdx;
            ringStartIdx = i + 1;
        } else {


            next = i + 1;
        }
        if (isClippedEdge(vertices, current, next, EXTENT)) {
            continue;
        }
        if ((i - startIdx) % 2 === 1) {
            //加上 2 * vertexCount，使用与 i % 2 === 0 时，不同的另一组端点，以避免共端点
            current += 2 * vertexCount;
            next += 2 * vertexCount;
        }
        //top[i], bottom[i], top[i + 1]
        indices.push(current + vertexCount, current, next);
        //bottom[i + 1], top[i + 1], bottom[i]
        indices.push(next, next + vertexCount, current + vertexCount);
    }
    if (generateUV) {
        buildSideUV(uvs, vertices, indices.slice(s, indices.length), uvSize[0], uvSize[1], glScale, vScale); //convert uvSize[1] to meter
    }
    return offset;
}
