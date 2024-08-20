import Point from '@mapbox/point-geometry';
/*eslint-disable no-var*/
/*!
 * from @turf/bboxClip
 * https://github.com/Turfjs/turf
 * MIT LICENSE
 */

const ARR0 = [];
const ARR1 = [];

// Sutherland-Hodgeman polygon clipping algorithm
export function clipPolygon(points, bbox) {

    var result, edge, prev, prevInside, i, p, inside;

    // clip against each side of the clip rectangle
    for (edge = 1; edge <= 8; edge *= 2) {
        result = [];
        prev = points[points.length - 1];
        prevInside = !(bitCode(prev, bbox) & edge);

        for (i = 0; i < points.length; i++) {
            p = points[i];
            inside = !(bitCode(p, bbox) & edge);

            // if segment goes through the clip window, add an intersection
            if (inside !== prevInside) {
                const inter = intersect(prev, p, edge, bbox);
                if (p.x !== undefined) {
                    result.push(new Point(inter[0], inter[1]));
                } else {
                    result.push(inter);
                }
            }

            if (inside) result.push(p); // add a point if it's inside

            prev = p;
            prevInside = inside;
        }

        points = result;

        if (!points.length) break;
    }

    return result;
}
// intersect a segment against one of the 4 lines that make up the bbox

function intersect(a, b, edge, bbox) {
    ARR0[0] = a.x === undefined ? a[0] : a.x;
    ARR0[1] = a.y === undefined ? a[1] : a.y;
    a = ARR0;
    ARR1[0] = b.x === undefined ? b[0] : b.x;
    ARR1[1] = b.y === undefined ? b[1] : b.y;
    b = ARR1;
    return edge & 8 ? [a[0] + (b[0] - a[0]) * (bbox[3] - a[1]) / (b[1] - a[1]), bbox[3]] : // top
        edge & 4 ? [a[0] + (b[0] - a[0]) * (bbox[1] - a[1]) / (b[1] - a[1]), bbox[1]] : // bottom
            edge & 2 ? [bbox[2], a[1] + (b[1] - a[1]) * (bbox[2] - a[0]) / (b[0] - a[0])] : // right
                edge & 1 ? [bbox[0], a[1] + (b[1] - a[1]) * (bbox[0] - a[0]) / (b[0] - a[0])] : // left
                    null;
}

// bit code reflects the point position relative to the bbox:

//         left  mid  right
//    top  1001  1000  1010
//    mid  0001  0000  0010
// bottom  0101  0100  0110

function bitCode(p, bbox) {
    ARR0[0] = p.x === undefined ? p[0] : p.x;
    ARR0[1] = p.y === undefined ? p[1] : p.y;
    p = ARR0;
    var code = 0;

    if (p[0] < bbox[0]) code |= 1; // left
    else if (p[0] > bbox[2]) code |= 2; // right

    if (p[1] < bbox[1]) code |= 4; // bottom
    else if (p[1] > bbox[3]) code |= 8; // top

    return code;
}
