import { countVertexes, isClippedEdge, fillPosArray, getHeightValue } from './Common';
import { getIndexArrayType } from '../../common/Util';

export function buildWireframe(
    features, EXTENT,
    {
        altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight,
        bottom
    }
) {
    const drawBottom = bottom;
    const scale = EXTENT / features[0].extent;
    // debugger
    const size = countVertexes(features) * 2 + features.length * 3 * 2; //wireframe need to count last point in

    const featIndexes = [];
    const vertices = new Int16Array(size);
    const indices = [];

    function fillIndices(start, offset, height) {
        // debugger
        const count = offset - start;

        const top = vertices.subarray(start, offset);
        //fill bottom vertexes
        const bottom = vertices.subarray(offset, offset + count);
        bottom.set(top);
        for (let i = 2, l = bottom.length; i < l; i += 3) {
            bottom[i] = top[i] - height; //top[i] is altitude
        }

        //build indices
        const startIdx = start / 3;
        const vertexCount = count / 3;
        let current, next;
        for (let i = startIdx, l = vertexCount + startIdx; i < l; i++) {
            if (i < l - 1) {
                current = i;
                next = i + 1;
            } else {
                current = i;
                next = startIdx;
            }
            if (isClippedEdge(vertices, current, next, EXTENT)) {
                continue;
            }
            //top
            indices.push(current, next);
            //bottom
            if (drawBottom) {
                indices.push(current + vertexCount, next + vertexCount);
            }
            if (hasClippedPoint(vertices, current, EXTENT)) {
                continue;
            }
            //vertical top -> bottom
            indices.push(current, current + vertexCount);
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
        for (let i = 0, l = geometry.length; i < l; i++) {
            // const ring = geometry[i];
            let ring = geometry[i];
            //earcut required the first and last position must be different
            const ringLen = ring.length;
            if (ring[0][0] === ring[ringLen - 1][0] && ring[0][1] === ring[ringLen - 1][1]) {
                ring = ring.slice(0, ringLen - 1);
            }
            offset = fillPosArray(vertices, start, ring, scale, altitude);
            offset = fillIndices(start, offset, height * scale); //need to multiply with scale as altitude is
            start = offset;
        }
        const count = indices.length - featIndexes.length;
        for (let i = 0; i < count; i++) {
            featIndexes.push(r);
        }
    }
    const maxIndex = indices.reduce((a, b) => {
        return Math.max(a, b);
    }, 0);

    const ctor = getIndexArrayType(maxIndex);
    const tIndices = new ctor(indices);

    const feaCtor = getIndexArrayType(features.length);

    const data = {
        vertices,  // vertexes
        indices : tIndices,    // indices for drawElements
        featureIndexes : new feaCtor(featIndexes)     // vertex index of each feature
    };
    return data;
}

export function hasClippedPoint(vertices, i0, EXTENT) {
    const x0 = vertices[i0 * 3], y0 = vertices[i0 * 3 + 1];
    return (x0 < 0 || x0 > EXTENT ||
        y0 < 0 || y0 > EXTENT);
}
