import { countVertexes, isClippedEdge, fillPosArray } from './Common';
import { KEY_IDX } from '../../common/Constant';
import { vec3 } from 'gl-matrix';
import { isFunctionDefinition } from '@maptalks/function-type';
import { getVectorPacker } from '../../packer/inject';

const { PackUtil, StyleUtil, FilterUtil } = getVectorPacker();

export function buildWireframe(
    features, EXTENT, colorSymbol, opacity,
    {
        altitudeScale, altitudeProperty, defaultAltitude, heightProperty, minHeightProperty, defaultHeight,
        bottom
    }
) {
    const drawBottom = bottom;
    const scale = EXTENT / features[0].extent;
    // debugger
    const size = countVertexes(features) * 2 + features.length * 3 * 2; //wireframe need to count last point in

    const featIndexes = [];
    const vertices = new Int16Array(size);
    const colors = new Uint8Array(vertices.length / 3 * 4);
    if (isFunctionDefinition(colorSymbol)) {
        colorSymbol = FilterUtil.compileFilter(colorSymbol);
    }
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
    let maxAltitude = -Infinity;
    let minAltitude = Infinity;
    const keyName = (KEY_IDX + '').trim();
    const rgb = [];
    for (let r = 0, n = features.length; r < n; r++) {
        const feature = features[r];
        const geometry = feature.geometry;
        if (colorSymbol) {
            let color;
            if (typeof colorSymbol === 'function') {
                color = colorSymbol(feature && feature.properties);
            } else {
                color = colorSymbol;
            }
            StyleUtil.normalizeColor(rgb, color);
        } else {
            vec3.set(rgb, 255, 255, 255);
        }

        const colorStart = offset / 3 * 4;
        const { altitude, height } = PackUtil.getFeaAltitudeAndHeight(feature, altitudeScale, altitudeProperty, defaultAltitude, heightProperty, defaultHeight, minHeightProperty);
        if (height < 0) {
            minAltitude = Math.min(altitude, minAltitude);
            maxAltitude = Math.max(altitude - height, maxAltitude);
        } else {
            minAltitude = Math.min(altitude - height, minAltitude);
            maxAltitude = Math.max(altitude, maxAltitude);
        }

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

        const colorEnd = start / 3 * 4;
        for (let i = colorStart; i < colorEnd; i += 4) {
            colors[i] = rgb[0];
            colors[i + 1] = rgb[1];
            colors[i + 2] = rgb[2];
            colors[i + 3] = 255 * (opacity || 1);
        }
        const count = indices.length - featIndexes.length;
        for (let i = 0; i < count; i++) {
            featIndexes.push(feature[keyName]);
        }
    }
    const maxIndex = indices.reduce((a, b) => {
        return Math.max(a, b);
    }, 0);

    const ctor = PackUtil.getIndexArrayType(maxIndex);
    const tIndices = new ctor(indices);

    const feaCtor = PackUtil.getUnsignedArrayType(features.length);
    const maxAltitudeValue = Math.max(Math.abs(maxAltitude, Math.abs(minAltitude)));
    const posArrayType = PackUtil.getPosArrayType(Math.max(512, maxAltitudeValue));
    const data = {
        aPosition: new posArrayType(vertices),  // vertexes
        indices: tIndices,    // indices for drawElements
        aPickingId: new feaCtor(featIndexes),     // vertex index of each feature
        aColor: colors,
        maxAltitude: maxAltitude === -Infinity ? 0 : maxAltitude / 100,
        minAltitude: minAltitude === Infinity ? 0 : minAltitude / 100
    };
    return data;
}

export function hasClippedPoint(vertices, i0, EXTENT) {
    const x0 = vertices[i0 * 3], y0 = vertices[i0 * 3 + 1];
    return (x0 < 0 || x0 > EXTENT ||
        y0 < 0 || y0 > EXTENT);
}
