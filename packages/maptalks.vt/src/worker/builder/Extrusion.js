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
        for (let i = startIdx, l = vertexCount + startIdx; i < l; i++) {
            if (i < l - 1) {
                //top[i], bottom[i], top[i + 1]
                indices.push(i + vertexCount, i, i + 1);
                //bottom[i + 1], top[i + 1], bottom[i]
                indices.push(i + 1, i + vertexCount + 1, i + vertexCount);
            } else {
                //top[l - 1], bottom[l - 1], top[0]
                indices.push(i + vertexCount, i, startIdx);
                //bottom[0], top[0], bottom[l - 1]
                indices.push(startIdx, startIdx + vertexCount, i + vertexCount);
            }
        }
        return offset + count;
    }

    // debugger

    let offset = 0;
    for (let r = 0, n = features.length; r < n; r++) {
        const feature = features[r];
        const geometry = feature.geometry;

        const altitude = getHeightValue(feature.properties, altitudeProperty, defaultAltitude) * altitudeScale;
        let start = offset;
        let holes = [];

        for (let i = 0, l = geometry.length; i < l; i++) {
            //fill bottom vertexes
            const isHole = calculateSignedArea(geometry[i]) < 0;
            const segStart = offset - start;
            let ring = geometry[i];
            if (feature.type === 3) ring = ring.slice(0, ring.length - 1);
            // a seg or a ring in line or polygon
            offset = fillPosArray(vertices, offset, ring, scale, altitude);
            if (isHole) {
                holes.push(segStart / 3);
            }
            if (!isHole && i > 0 || i === l - 1) {
                let height = altitude;
                if (heightProperty) {
                    height = getHeightValue(feature.properties, heightProperty, defaultHeight) * altitudeScale;
                }
                //an exterior ring
                offset = fillData(start, offset, holes, height * scale); //need to multiply with scale as altitude is
                holes = [];
                start = offset;
            }
        }
        indexes[r] = indices.length;
    }
    return {
        vertices,  // vertexes
        indices : new Uint16Array(indices),    // indices for drawElements
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
