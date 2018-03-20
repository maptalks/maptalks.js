import Point from '../../geo/Point';


export function clipLine(points, bounds, round, noCut) {
    const parts = [];
    let k = 0, segment;
    for (let j = 0, l = points.length; j < l - 1; j++) {
        segment = clipSegment(points[j], points[j + 1], bounds, j, round, noCut);

        if (!segment) { continue; }

        parts[k] = parts[k] || [];
        parts[k].push({
            'point' : segment[0],
            'index' : j
        });

        // if segment goes out of screen, or it's the last one, it's the end of the line part
        if ((segment[1] !== points[j + 1]) || (j === l - 2)) {
            // parts[k].push(segment[1]);
            parts[k].push({
                'point' : segment[1],
                'index' : j + 1
            });
            k++;
        }
    }
    return parts;
}

let _lastCode;

// @function clipSegment(a: Point, b: Point, bounds: Bounds, useLastCode?: Boolean, round?: Boolean): Point[]|Boolean
// Clips the segment a to b by rectangular bounds with the
// [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm)
// (modifying the segment points directly!). Used by Leaflet to only show polyline
// points that are on the screen or near, increasing performance.
// @copyright Leaflet
export function clipSegment(a, b, bounds, useLastCode, round, noCut) {
    let codeA = useLastCode ? _lastCode : _getBitCode(a, bounds),
        codeB = _getBitCode(b, bounds),

        codeOut, p, newCode;

    // save 2nd code to avoid calculating it on the next segment
    _lastCode = codeB;

    while (true) {
        // if a,b is inside the clip window (trivial accept)
        if (!(codeA | codeB)) {
            return [a, b];
        }

        // if a,b is outside the clip window (trivial reject)
        if (codeA & codeB) {
            return false;
        }

        if (noCut) {
            return [a, b];
        }
        // other cases
        codeOut = codeA || codeB;
        p = _getEdgeIntersection(a, b, codeOut, bounds, round);
        newCode = _getBitCode(p, bounds);

        if (codeOut === codeA) {
            a = p;
            codeA = newCode;
        } else {
            b = p;
            codeB = newCode;
        }
    }
}

/* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
 * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgeman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
 * Used by Leaflet to only show polygon points that are on the screen or near, increasing
 * performance. Note that polygon points needs different algorithm for clipping
 * than polyline, so there's a seperate method for it.
 * @copyright Leaflet
 */
export function clipPolygon(points, bounds, round) {
    const edges = [1, 4, 2, 8];
    let clippedPoints,
        i, j, k,
        a, b,
        len, edge, p;

    for (i = 0, len = points.length; i < len; i++) {
        points[i]._code = _getBitCode(points[i], bounds);
    }

    // for each edge (left, bottom, right, top)
    for (k = 0; k < 4; k++) {
        edge = edges[k];
        clippedPoints = [];

        for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            a = points[i];
            b = points[j];

            // if a is inside the clip window
            if (!(a._code & edge)) {
                // if b is outside the clip window (a->b goes out of screen)
                if (b._code & edge) {
                    p = _getEdgeIntersection(b, a, edge, bounds, round);
                    p._code = _getBitCode(p, bounds);
                    clippedPoints.push(p);
                }
                clippedPoints.push(a);

            // else if b is inside the clip window (a->b enters the screen)
            } else if (!(b._code & edge)) {
                p = _getEdgeIntersection(b, a, edge, bounds, round);
                p._code = _getBitCode(p, bounds);
                clippedPoints.push(p);
            }
        }
        points = clippedPoints;
    }

    return points;
}

/**
 * caculate the distance from a point to a segment.
 * @param {Point} p
 * @param {Point} p1
 * @param {Point} p2
 * @return {Number} distance from p to (p1, p2)
 * @memberOf Util
 */
export function distanceToSegment(p, p1, p2) {
    const x = p.x,
        y = p.y,
        x1 = p1.x,
        y1 = p1.y,
        x2 = p2.x,
        y2 = p2.y;

    const cross = (x2 - x1) * (x - x1) + (y2 - y1) * (y - y1);
    if (cross <= 0) {
        // P->P1
        return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
    }
    const d2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (cross >= d2) {
        // P->P2
        return Math.sqrt((x - x2) * (x - x2) + (y - y2) * (y - y2));
    }
    const r = cross / d2;
    const px = x1 + (x2 - x1) * r;
    const py = y1 + (y2 - y1) * r;
    // P->P(px,py)
    return Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
}

/**
 * Whether the coordinate is inside the polygon
 * @param {Polygon}         - polygon
 * @param {Coordinate}      - coordinate
 * @return {Boolean}
 * @memberOf Util
 */
export function pointInsidePolygon(p, points) {
    let p1, p2;
    const len = points.length;
    let c = false;

    for (let i = 0, j = len - 1; i < len; j = i++) {
        p1 = points[i];
        p2 = points[j];
        if (((p1.y > p.y) !== (p2.y > p.y)) &&
            (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
            c = !c;
        }
    }

    return c;
}

function _getEdgeIntersection(a, b, code, bounds, round) {
    const dx = b.x - a.x,
        dy = b.y - a.y,
        min = bounds.getMin(),
        max = bounds.getMax();
    let x, y;

    if (code & 8) { // top
        x = a.x + dx * (max.y - a.y) / dy;
        y = max.y;

    } else if (code & 4) { // bottom
        x = a.x + dx * (min.y - a.y) / dy;
        y = min.y;

    } else if (code & 2) { // right
        x = max.x;
        y = a.y + dy * (max.x - a.x) / dx;

    } else if (code & 1) { // left
        x = min.x;
        y = a.y + dy * (min.x - a.x) / dx;
    }

    const p = new Point(x, y);
    if (round) {
        p._round();
    }
    return p;
}

function _getBitCode(p, bounds) {
    let code = 0;

    if (p.x < bounds.getMin().x) { // left
        code |= 1;
    } else if (p.x > bounds.getMax().x) { // right
        code |= 2;
    }

    if (p.y < bounds.getMin().y) { // bottom
        code |= 4;
    } else if (p.y > bounds.getMax().y) { // top
        code |= 8;
    }

    return code;
}

/**
 * Is the point within an ellipse
 * @param {Point} point
 * @param {Point} center ellipse's center
 * @param {Point} southeast ellipse's southeast point
 * @param {Number} tolerance
 * @returns {Boolean}
 * @private
 * @memberOf Util
 */
export function withInEllipse(point, center, southeast, tolerance) {
    point = new Point(point);
    const a = Math.abs(southeast.x - center.x),
        b = Math.abs(southeast.y - center.y),
        c = Math.sqrt(Math.abs(a * a - b * b)),
        xfocus = a >= b;
    let f1, f2, d;
    if (xfocus) {
        f1 = new Point(center.x - c, center.y);
        f2 = new Point(center.x + c, center.y);
        d = a * 2;
    } else {
        f1 = new Point(center.x, center.y - c);
        f2 = new Point(center.x, center.y + c);
        d = b * 2;
    }
    /*
    L1 + L2 = D
    L1 + t >= L1'
    L2 + t >= L2'
    D + 2t >= L1' + L2'
    */
    return (point.distanceTo(f1) + point.distanceTo(f2)) <= (d + 2 * tolerance);
}
