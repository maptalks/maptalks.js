import { countVertexes, calculateSignedArea, fillPosArray } from './Common';
import { pushIn } from '../../layer/core/Util';
import earcut from 'earcut';

export function buildExtrudeFaces(features, EXTENT,
    altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight
) {
    const scale = EXTENT / features[0].extent;

    const size = countVertexes(features) * 2;
    //indexes : index of indices for each feature
    const indexes = new Uint32Array(features.length),
        vertices = new Int16Array(size);
    const indices = [];

    function fillData(start, offset, holes, height) {
        const count = offset - start;

        const top = vertices.subarray(start, offset);
        //fill bottom vertexes
        const bottom = vertices.subarray(offset, offset + count);
        bottom.set(top);
        for (let i = 2, l = bottom.length; i < l; i += 3) {
            bottom[i] = top[i] - height; //top[i] is altitude
        }

        //just ignore bottom indices never in sight
        const triangles = earcut(top, holes, 3); //vertices, holes, dimension(2|3)
        if (triangles.length === 0) {
            return offset + count;
        }
        //TODO caculate earcut deviation

        //switch triangle's i + 1 and i + 2 to make it counter-clockwise (front face) from the top
        let tmp;
        for (let i = 2, l = triangles.length; i < l; i += 3) {
            tmp = triangles[i - 1];
            triangles[i - 1] = triangles[i] + start / 3;
            triangles[i] = tmp + start / 3;
            triangles[i - 2] += start / 3;
        }

        // for (let i = 0, l = triangles.length; i < l; i++) {
        //     triangles[i] += start / 3;
        // }

        //top indices
        pushIn(indices, triangles);
        // debugger
        //side indices
        const startIdx = start / 3;
        const vertexCount = count / 3;
        let ringStartIdx = startIdx;
        // debugger
        for (let i = startIdx, l = vertexCount + startIdx; i < l; i++) {
            if (i === l - 1 || holes.indexOf(i - startIdx + 1) >= 0) {
                //top[l - 1], bottom[l - 1], top[0]
                indices.push(i + vertexCount, i, ringStartIdx);
                //bottom[0], top[0], bottom[l - 1]
                indices.push(ringStartIdx, ringStartIdx + vertexCount, i + vertexCount);
                if (i < l - 1) {
                    //it's a hole, relocate ringStartIdx to hole's start
                    ringStartIdx = i + 1;
                }
            } else if (i < l - 1) {
                //top[i], bottom[i], top[i + 1]
                indices.push(i + vertexCount, i, i + 1);
                //bottom[i + 1], top[i + 1], bottom[i]
                indices.push(i + 1, i + vertexCount + 1, i + vertexCount);
            }
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
        indexes[r] = indices.length;
    }

    const tIndices = indices.length > 65536 ? new Uint32Array(indices) : new Uint16Array(indices);

    return {
        vertices,  // vertexes
        indices : tIndices,    // indices for drawElements
        indexes : indexes     // vertex index of each feature
    };
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
