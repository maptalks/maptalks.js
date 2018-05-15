import { countVertexes, calculateSignedArea, fillPosArray } from './Common';
import { buildFaceUV, buildSideUV } from './UV.js';
import { pushIn } from '../../layer/core/Util.js';
import { exportIndices } from '../util/Util.js';
import earcut from 'earcut';

export function buildExtrudeFaces(
    features, EXTENT,
    {
        altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight
    },
    {
        uv,
        uvSize,
        glScale,
        vScale //用于将meter转化为矢量瓦片内的坐标值
    }
) {
    // debugger
    const scale = EXTENT / features[0].extent;

    const size = countVertexes(features) * 2;
    //featIndexes : index of indices for each feature
    const featIndexes = new Array(features.length),
        vertices = new Int16Array(size);
    const indices = [];
    const generateUV = uv;
    const uvs = generateUV ? [] : null;

    function fillData(start, offset, holes, height) {
        const count = offset - start;

        const top = vertices.subarray(start, offset);
        //fill bottom vertexes
        const bottom = vertices.subarray(offset, offset + count);
        bottom.set(top);
        for (let i = 2, l = bottom.length; i < l; i += 3) {
            bottom[i] = top[i] - height; //top[i] is altitude
        }

        //just ignore bottom faces never appear in sight

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
        // debugger
        const s = indices.length;
        //side face indices
        const startIdx = start / 3;
        const vertexCount = count / 3;
        let ringStartIdx = startIdx;
        for (let i = startIdx, l = vertexCount + startIdx; i < l; i++) {
            if (i === l - 1 || holes.indexOf(i - startIdx + 1) >= 0) {
                if (!isBoundaryEdge(vertices, i, ringStartIdx, EXTENT)) {
                    //top[l - 1], bottom[l - 1], top[0]
                    indices.push(i + vertexCount, i, ringStartIdx);
                    //bottom[0], top[0], bottom[l - 1]
                    indices.push(ringStartIdx, ringStartIdx + vertexCount, i + vertexCount);
                }
                if (i < l - 1) {
                    //it's a hole, relocate ringStartIdx to hole's start
                    ringStartIdx = i + 1;
                }
            } else if (i < l - 1) {
                if (isBoundaryEdge(vertices, i, i + 1, EXTENT)) {
                    continue;
                }
                //top[i], bottom[i], top[i + 1]
                indices.push(i + vertexCount, i, i + 1);
                //bottom[i + 1], top[i + 1], bottom[i]
                indices.push(i + 1, i + vertexCount + 1, i + vertexCount);
            }
        }
        if (generateUV) {
            // debugger
            buildSideUV(uvs, vertices, indices.slice(s, indices.length), [uvSize[0] / glScale, uvSize[1] / vScale]); //convert uvSize[1] to meter
        }
        return offset + count;
    }


    let offset = 0;

    for (let r = 0, n = features.length; r < n; r++) {
        const feature = features[r];
        const geometry = feature.geometry;

        const altitude = getHeightValue(feature.properties, altitudeProperty, defaultAltitude) * altitudeScale;
        const height = heightProperty ? getHeightValue(feature.properties, heightProperty, defaultHeight) * altitudeScale : altitude;

        let start = offset;
        let holes = [];
        for (let i = 0, l = geometry.length; i < l; i++) {
            const isHole = calculateSignedArea(geometry[i]) < 0;
            //fill bottom vertexes
            if (!isHole && i > 0) {
                //an exterior ring (multi plygon)
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
                holes = [];
                start = offset;
            }
            const segStart = offset - start;
            let ring = geometry[i];
            //earcut required the first and last position must be different
            if (feature.type === 3) ring = ring.slice(0, ring.length - 1);
            // a seg or a ring in line or polygon
            offset = fillPosArray(vertices, offset, ring, scale, altitude);
            if (isHole) {
                holes.push(segStart / 3);
            }
            if (i === l - 1) {
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
            }
        }
        featIndexes[r] = indices.length;
    }

    const tIndices = exportIndices(indices);


    const data = {
        vertices,  // vertexes
        indices : tIndices,    // indices for drawElements
        indexes : new tIndices.constructor(featIndexes)     // vertex index of each feature
    };
    if (uvs) {
        data.uvs = new Float32Array(uvs);
    }
    return data;
}

// get height value from properties
function getHeightValue(properties, heightProp, defaultValue) {
    //prepare altitude property
    let height = defaultValue;
    if (heightProp) {
        height = properties[heightProp];
    }
    if (height === undefined) {
        height = defaultValue;
    }
    return height;
}

function isBoundaryEdge(vertices, i0, i1, EXTENT) {
    const x0 = vertices[i0 * 3], y0 = vertices[i0 * 3 + 1],
        x1 = vertices[i1 * 3], y1 = vertices[i1 * 3 + 1];
    return (x0 === x1 && (x0 < 0 || x0 > EXTENT)) ||
        (y0 === y1 && (y0 < 0 || y0 > EXTENT));
}
