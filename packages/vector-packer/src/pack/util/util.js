/**
 * Indicates if the provided Points are in a counter clockwise (true) or clockwise (false) order
 *
 * @private
 * @returns true for a counter clockwise set of points
 */
// http://bryceboe.com/2006/10/23/line-segment-intersection-algorithm/
export function isCounterClockwise(a, b, c) {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

/**
 * Returns the signed area for the polygon ring.  Postive areas are exterior rings and
 * have a clockwise winding.  Negative areas are interior rings and have a counter clockwise
 * ordering.
 *
 * @private
 * @param ring Exterior or interior ring
 */
export function calculateSignedArea(ring) {
    let sum = 0;
    for (let i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        sum += (p2.x - p1.x) * (p1.y + p2.y);
    }
    return sum;
}

export function isClippedEdge(vertices, i0, i1, width, EXTENT) {
    const x0 = vertices[i0 * width], y0 = vertices[i0 * width + 1],
        x1 = vertices[i1 * width], y1 = vertices[i1 * width + 1];
    return x0 === x1 && (x0 < 0 || x0 > EXTENT) && y0 !== y1 ||
        y0 === y1 && (y0 < 0 || y0 > EXTENT) && x0 !== x1;
}
