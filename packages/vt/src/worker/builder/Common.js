import { isNumber } from '../../layer/core/Util';

/**
 * Iterate features, and caculate vertex count in typedarray position
 * @param {Object[]} features - features to iterate
 * @param {Boolean} isLine - whether it's a line
 * @returns {Number}
 */
export function countVertexes(features, isLine) {
    let num = 0;
    for (let i = 0, l = features.length; i < l; i++) {
        const feature = features[i];
        if (isNumber(feature.geometry[0][0])) {
            //a multi geometry
            const count = feature.geometry.length * 3;
            num += isLine ? count * 2 - 6 : count;
        } else {
            for (let ii = 0, ll = feature.geometry.length; ii < ll; ii++) {
                let count = feature.geometry[ii].length * 3;
                if (feature.type === 3) { //polygon
                    count -= 3; //remove the last vertex
                }
                num += isLine ? count * 2 - 6 : count;
            }
        }
    }
    return num;
}

/**
 *
 * @param {TypedArray} vertices - vertices array to fill
 * @param {Number} offset - start offset
 * @param {Number[][]|Object[]} segment - segment, can be [[x, y], [x, y]...] or [{x, y}, {x, y}]
 * @param {Number} scale - scale
 * @param {Number|Number[]} altitude - altitude or altitude[]
 * @param {Boolean} isLine
 */
export function fillPosArray(vertices, offset, segment, scale, altitude, isLine) {
    const isCoordArr = segment && Array.isArray(segment[0]);
    for (let i = 0, l = segment.length; i < l; i++) {
        vertices[offset] = Math.round((isCoordArr ? segment[i][0] : segment[i].x) * scale);
        vertices[offset + 1] = Math.round((isCoordArr ? segment[i][1] : segment[i].y) * scale);

        let alt = altitude || 0;
        if (Array.isArray(altitude)) {
            alt = altitude[i];
        }
        alt = alt ? Math.round(scale * alt) : 0;
        vertices[offset + 2] = alt; // for altitude

        offset += 3;

        if (isLine && i !== 0 && i !== l - 1) {
            // start of the next line segment
            vertices[offset] = vertices[offset - 3];
            vertices[offset + 1] = vertices[offset - 2];
            vertices[offset + 2] = vertices[offset - 1];
            offset += 3;
        }
    }
    return offset;
}

/**
 * from mapbox-gl-js
 * Returns the signed area for the polygon ring.  Postive areas are exterior rings and
 * have a clockwise winding.  Negative areas are interior rings and have a counter clockwise
 * ordering.
 *
 * @param ring Exterior or interior ring
 */
export function calculateSignedArea(ring) {
    let sum = 0;
    for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        sum += (p2[0] - p1[0]) * (p1[1] + p2[1]);
    }
    return sum;
}


// get height value from properties
export function getHeightValue(properties, heightProp, defaultValue) {
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

export function isClippedEdge(vertices, i0, i1, EXTENT) {
    const x0 = vertices[i0 * 3], y0 = vertices[i0 * 3 + 1],
        x1 = vertices[i1 * 3], y1 = vertices[i1 * 3 + 1];
    return (x0 === x1 && (x0 < 0 || x0 > EXTENT)) ||
        (y0 === y1 && (y0 < 0 || y0 > EXTENT));
}
