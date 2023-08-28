import { isNumber } from '../../common/Util';

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
export function fillPosArray(vertices, offset, segment, scale, altitude, isLine, positionType) {
    const isCoordArr = segment && Array.isArray(segment[0]);
    for (let i = 0, l = segment.length; i < l; i++) {
        vertices[offset] = (isCoordArr ? segment[i][0] : segment[i].x) * scale;
        vertices[offset + 1] = (isCoordArr ? segment[i][1] : segment[i].y) * scale;
        if (positionType !== Float32Array) {
            vertices[offset] = Math.round(vertices[offset]);
            vertices[offset + 1] = Math.round(vertices[offset + 1]);
        }

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
    if (vertices.trySetLength) {
        vertices.trySetLength(offset);
    }
    return offset;
}

export function isClippedEdge(vertices, i0, i1, EXTENT) {
    const x0 = vertices[i0 * 3], y0 = vertices[i0 * 3 + 1],
        x1 = vertices[i1 * 3], y1 = vertices[i1 * 3 + 1];
    return (x0 === x1 && (x0 < 0 || x0 > EXTENT)) ||
        (y0 === y1 && (y0 < 0 || y0 > EXTENT));
}
