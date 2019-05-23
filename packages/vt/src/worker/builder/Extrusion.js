import { calculateSignedArea, fillPosArray, getHeightValue, isClippedEdge } from './Common';
import { buildFaceUV, buildSideUV } from './UV';
import { pushIn, getIndexArrayType } from '../../common/Util';
import { clipPolygon } from './clip';
import earcut from 'earcut';
import { KEY_IDX } from './Constant';

export function buildExtrudeFaces(
    features, EXTENT,
    {
        altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight
    },
    {
        top,
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
    const featIndexes = [],
        vertices = [];
    const indices = [];
    const generateUV = !!uv,
        generateTop = !!top;
    const uvs = generateUV ? [] : null;
    // const clipEdges = [];

    function fillData(start, offset, holes, height) {
        // debugger
        const count = offset - start;

        const top = vertices.slice(start, offset);
        //fill bottom vertexes
        // const bottom = vertices.subarray(offset, offset + count);
        // if (top.length > bottom.length) {
        //     debugger
        // }
        // bottom.set(top);
        for (let i = 2, l = count; i < l; i += 3) {
            vertices[offset + i - 2] = top[i - 2]; //top[i] is altitude
            vertices[offset + i - 1] = top[i - 1]; //top[i] is altitude
            vertices[offset + i] = top[i] - height; //top[i] is altitude
        }

        //just ignore bottom faces never appear in sight
        if (generateTop) {
            const triangles = earcut(top, holes, 3); //vertices, holes, dimension(2|3)
            if (triangles.length === 0) {
                return offset + count;
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

            // //cw widing
            // for (let i = 0, l = triangles.length; i < l; i++) {
            //     triangles[i] += start / 3;
            // }

            //top face indices
            pushIn(indices, triangles);
            if (generateUV) {
                buildFaceUV(uvs, vertices, triangles, [uvSize[0] / glScale, uvSize[1] / glScale]);
            }
        }

        if (height > 0) {
            //side face indices
            const s = indices.length;
            const startIdx = start / 3;
            const vertexCount = count / 3;
            let ringStartIdx = startIdx, current, next, isClipped;
            for (let i = startIdx, l = vertexCount + startIdx; i < l; i++) {
                current = i;
                if (i === l - 1 || holes.indexOf(i - startIdx + 1) >= 0) {
                    next = ringStartIdx;
                    if (i < l - 1) {
                        ringStartIdx = i + 1;
                    }
                } else if (i < l - 1) {
                    next = i + 1;
                }
                isClipped = isClippedEdge(vertices, current, next, EXTENT);
                if (isClipped) {
                    continue;
                }
                //top[i], bottom[i], top[i + 1]
                indices.push(current + vertexCount, current, next);
                //bottom[i + 1], top[i + 1], bottom[i]
                indices.push(next, next + vertexCount, current + vertexCount);
            }
            if (generateUV) {
                buildSideUV(uvs, vertices, indices.slice(s, indices.length), [uvSize[0] / glScale, uvSize[1] / vScale]); //convert uvSize[1] to meter
            }
        }
        return offset + count;
    }


    let offset = 0;
    // debugger
    for (let r = 0, n = features.length; r < n; r++) {
        const feature = features[r];
        const BOUNDS = [-1, -1, feature.extent + 1, feature.extent + 1];
        const geometry = feature.geometry;

        const altitude = getHeightValue(feature.properties, altitudeProperty, defaultAltitude) * altitudeScale;
        const height = heightProperty ? getHeightValue(feature.properties, heightProperty, defaultHeight) * altitudeScale : altitude;

        let start = offset;
        let holes = [];
        for (let i = 0, l = geometry.length; i < l; i++) {
            const isHole = calculateSignedArea(geometry[i]) < 0;
            //fill bottom vertexes
            if (!isHole && i > 0) {
                //an exterior ring (multi polygon)
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
                holes = [];
                start = offset;
            }
            const segStart = offset - start;
            let ring = geometry[i];
            ring = clipPolygon(ring, BOUNDS, true);
            if (!ring.length) {
                if (i === l - 1) {
                    offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
                }
                continue;
            }
            //earcut required the first and last position must be different
            const ringLen = ring.length;
            if (ring[0][0] === ring[ringLen - 1][0] && ring[0][1] === ring[ringLen - 1][1]) {
                ring = ring.slice(0, ringLen - 1);
            }
            // a seg or a ring in line or polygon
            offset = fillPosArray(vertices, offset, ring, scale, altitude);
            if (isHole) {
                holes.push(segStart / 3);
            }
            if (i === l - 1) {
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
            }
        }
        // need to buildUniqueVertex
        const count = indices.length - featIndexes.length;
        for (let i = 0; i < count; i++) {
            featIndexes.push(feature[KEY_IDX] || r);
        }
    }
    const feaCtor = getIndexArrayType(features.length);

    const data = {
        vertices : new Int16Array(vertices),        // vertexes
        indices,                                    // indices for drawElements
        featureIndexes : new feaCtor(featIndexes)   // vertex index of each feature
        // clipEdges : new Uint8Array(clipEdges)
    };
    if (uvs) {
        data.uvs = new Float32Array(uvs);
    }
    return data;
}
