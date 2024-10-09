import Point from '../../geo/Point';
import Coordinate from '../../geo/Coordinate';
import { isNumber } from './common';
import { BBOX } from './bbox';
import polygonClipping from 'polygon-clipping';

const TEMP_POINT = new Point(0, 0);
const MAP_TEMP_RING = [
    [],
    [],
    [],
    [],
    []
];
const TEMP_RING: Array<Point> = [];

export function clipLine(points, bounds, round?: boolean, noCut?: boolean) {
    const parts = [];
    let k = 0, segment;
    for (let j = 0, l = points.length; j < l - 1; j++) {
        segment = clipSegment(points[j], points[j + 1], bounds, j, round, noCut);

        if (!segment) { continue; }

        parts[k] = parts[k] || [];
        parts[k].push({
            'point': segment[0],
            'index': j
        });

        // if segment goes out of screen, or it's the last one, it's the end of the line part
        if ((segment[1] !== points[j + 1]) || (j === l - 2)) {
            // parts[k].push(segment[1]);
            parts[k].push({
                'point': segment[1],
                'index': j + 1
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
    //@internal
    _lastCode = codeB;
    /* eslint-disable no-constant-condition */
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
    /* eslint-enable no-constant-condition */
}

/* @function clipPolygon(points: Point[], bounds: Bounds, round?: Boolean): Point[]
 * Clips the polygon geometry defined by the given `points` by the given bounds (using the [Sutherland-Hodgeman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)).
 * Used by Leaflet to only show polygon points that are on the screen or near, increasing
 * performance. Note that polygon points needs different algorithm for clipping
 * than polyline, so there's a seperate method for it.
 * @copyright Leaflet
 */
export function clipPolygon(points, bounds, round?: boolean) {
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
 * @param p
 * @param p1
 * @param p2
 * @return distance from p to (p1, p2)
 * @memberOf Util
 */
export function distanceToSegment(p: Point, p1: Point, p2: Point) {
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
 * @param p
 * @param points
 * @return
 * @memberOf Util
 */
export function pointInsidePolygon(p: Coordinate, points: Coordinate[]): boolean {
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
 * @param  point
 * @param  center ellipse's center
 * @param  southeast ellipse's southeast point
 * @param  tolerance
 * @returns
 * @private
 * @memberOf Util
 */
export function withInEllipse(point: Point, center: Point, southeast: Point, tolerance: number) {
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


export function getMinMaxAltitude(altitude: number | number[] | number[][]): [number, number] {
    if (!altitude) {
        return [0, 0];
    }
    let min = Infinity, max = -Infinity;
    //number
    if (isNumber(altitude)) {
        min = max = altitude;
        return [min, max];
    }

    const pathMinMax = (alts: number[]) => {
        for (let i = 0, len = alts.length; i < len; i++) {
            const alt = alts[i];
            min = Math.min(min, alt);
            max = Math.max(max, alt);
        }
    }
    //number []
    if (!Array.isArray(altitude[0])) {
        pathMinMax(altitude as number[]);
        return [min, max];
    }
    //number [][]
    for (let i = 0, len = altitude.length; i < len; i++) {
        const alts = altitude[i];
        pathMinMax(alts as number[]);
    }
    return [min, max];
}

/**
 * 点在线段上
 * point in segment
 * @param p 
 * @param p1 
 * @param p2 
 * @returns 
 */
function pointInSegment(p: Point, p1: Point, p2: Point) {
    const dx = p2.x - p1.x;
    if (dx === 0) {
        const miny = Math.min(p1.y, p2.y);
        const maxy = Math.max(p1.y, p2.y);
        return p.y >= miny && p.y <= maxy && p.x === p1.x;
    }
    const dy = p2.y - p1.y;
    const k = dy / dx;

    if (k === 0) {
        const minx = Math.min(p1.x, p2.x);
        const maxx = Math.max(p1.x, p2.x);
        return p.x >= minx && p.x <= maxx && p.y === p1.y;
    }

    const b = p1.y - k * p1.x;
    const y = k * p.x + b
    return Math.abs(y - p.y) <= 0.0000001;
}

/**
 * point left segment
 * @param p 
 * @param p1 
 * @param p2 
 * @returns 
 */
function pointLeftSegment(p: Point, p1: Point, p2: Point) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x = p.x, y = p.y;
    return (y1 - y2) * x + (x2 - x1) * y + x1 * y2 - x2 * y1 > 0;
}

function pointRightSegment(p: Point, p1: Point, p2: Point) {
    return !pointLeftSegment(p, p1, p2);
}

function isClockwise(ring) {
    let sum = 0;
    let i = 1;
    let prev;
    let cur;
    const len = ring.length;

    while (i < len) {
        prev = cur || ring[0];
        cur = ring[i];
        sum += (cur.x - prev.x) * (cur.y + prev.y);
        i++;
    }
    return sum > 0;
}
/**
 * 点在三角形内
 * point in Triangle
 * @param p 
 * @param p1 
 * @param p2 
 * @param p3 
 * @returns 
 */
function pointInTriangle(p: Point, p1: Point, p2: Point, p3: Point) {
    TEMP_RING[0] = p1;
    TEMP_RING[1] = p2;
    TEMP_RING[2] = p3;
    TEMP_RING[3] = p1;
    if (isClockwise(TEMP_RING)) {
        const a = pointRightSegment(p, p1, p2);
        const b = pointRightSegment(p, p2, p3);
        const c = pointRightSegment(p, p3, p1);
        return a && b && c;
    }

    const a = pointLeftSegment(p, p1, p2);
    const b = pointLeftSegment(p, p2, p3);
    const c = pointLeftSegment(p, p3, p1);
    return a && b && c;

}

/**
 * Points within a convex quadrilateral
 * @param point 
 * @param p1 
 * @param p2 
 * @param p3 
 * @param p4 
 * @returns 
 */
function pointInQuadrilateral(p: Point, p1: Point, p2: Point, p3: Point, p4: Point) {
    //LT-RT
    const a = pointRightSegment(p, p1, p2) || pointInSegment(p, p1, p2);
    //RT-RB
    const b = pointRightSegment(p, p2, p3) || pointInSegment(p, p2, p3);
    //RB-LB
    const c = pointRightSegment(p, p3, p4) || pointInSegment(p, p3, p4);
    //LB-LT
    const d = pointRightSegment(p, p4, p1) || pointInSegment(p, p4, p1);
    return a && b && c && d;
}

// function pathInQuadrilateral(path, p1, p2, p3, p4) {
//     for (let i = 0, len = path.length; i < len; i++) {
//         const p = path[i];
//         if (!pointInQuadrilateral(p, p1, p2, p3, p4)) {
//             return false;
//         }
//     }
//     return true;
// }

// export function pathsInQuadrilateral(paths, p1, p2, p3, p4) {
//     if (!Array.isArray(paths[0][0])) {
//         paths = [paths];
//     }
//     // debug(paths, p1, p2, p3, p4);
//     for (let i = 0, len = paths.length; i < len; i++) {
//         if (!pathInQuadrilateral(paths[i], p1, p2, p3, p4)) {
//             return false;
//         }
//     }
//     return true;
// }

/**
 * bbox within a convex quadrilateral
 * @param bbox 
 * @param p1 
 * @param p2 
 * @param p3 
 * @param p4 
 * @returns 
 */
export function bboxInInQuadrilateral(bbox: BBOX, p1: Point, p2: Point, p3: Point, p4: Point) {
    const [xmin, ymin, xmax, ymax] = bbox;

    TEMP_POINT.x = xmin;
    TEMP_POINT.y = ymin;
    if (!pointInQuadrilateral(TEMP_POINT, p1, p2, p3, p4)) {
        return false;
    }

    TEMP_POINT.x = xmin;
    TEMP_POINT.y = ymax;
    if (!pointInQuadrilateral(TEMP_POINT, p1, p2, p3, p4)) {
        return false;
    }

    TEMP_POINT.x = xmax;
    TEMP_POINT.y = ymax;
    if (!pointInQuadrilateral(TEMP_POINT, p1, p2, p3, p4)) {
        return false;
    }

    TEMP_POINT.x = xmax;
    TEMP_POINT.y = ymin;
    if (!pointInQuadrilateral(TEMP_POINT, p1, p2, p3, p4)) {
        return false;
    }

    return true;
}

/**
 * 线段与线段交点
 * Intersection of two line segments
 * @param p1 
 * @param p2 
 * @param p3 
 * @param p4 
 * @returns 
 */
export function lineSegmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y;
    const dx2 = p4.x - p3.x, dy2 = p4.y - p3.y;
    if (dx1 === 0 && dx2 === 0) {
        return null;
    }
    if (dy1 === 0 && dy2 === 0) {
        return null;
    }

    const k1 = dy1 / dx1;
    const k2 = dy2 / dx2;

    const b1 = p1.y - k1 * p1.x;
    const b2 = p3.y - k2 * p3.x;

    let x, y;

    if (dx1 === 0) {
        x = p1.x;
        y = k2 * x + b2;
    } else if (dx2 === 0) {
        x = p3.x;
        y = k1 * x + b1;
    } else if (dy1 === 0) {
        y = p1.y;
        x = (y - b2) / k2;
    } else if (dy2 === 0) {
        y = p3.y;
        x = (y - b1) / k1;
    } else {
        x = (b2 - b1) / (k1 - k2);
        y = k1 * x + b1;
    }

    if (x < Math.min(p1.x, p2.x) || x > Math.max(p1.x, p2.x)) {
        return null;
    }
    if (x < Math.min(p3.x, p4.x) || x > Math.max(p3.x, p4.x)) {
        return null;
    }
    if (y < Math.min(p1.y, p2.y) || y > Math.max(p1.y, p2.y)) {
        return null;
    }
    if (y < Math.min(p3.y, p4.y) || y > Math.max(p3.y, p4.y)) {
        return null;
    }
    return new Point(x, y);
}

type CrossPoint = {
    point: Point,
    edgeIndex: number,
    edge: [Point, Point]
}
/**
 * 线段与凸四边形的交点
 * Intersection point of line segment and convex quadrilateral
 * @param currentPoint 
 * @param nextPoint 
 * @param p1 
 * @param p2 
 * @param p3 
 * @param p4 
 * @returns 
 */
function getSegmenQuadrilateralIntersections(currentPoint: Point, nextPoint: Point, p1: Point, p2: Point, p3: Point, p4: Point) {
    const a = lineSegmentIntersection(currentPoint, nextPoint, p1, p2);
    const b = lineSegmentIntersection(currentPoint, nextPoint, p2, p3);
    const c = lineSegmentIntersection(currentPoint, nextPoint, p3, p4);
    const d = lineSegmentIntersection(currentPoint, nextPoint, p4, p1);
    const points: Array<CrossPoint> = [];
    if (a) {
        points.push({
            point: a,
            edgeIndex: 1,
            edge: [p1, p2]
        });
    }
    if (b) {
        points.push({
            point: b,
            edgeIndex: 2,
            edge: [p2, p3]
        });
    }
    if (c) {
        points.push({
            point: c,
            edgeIndex: 3,
            edge: [p3, p4]
        });
    }
    if (d) {
        points.push({
            point: d,
            edgeIndex: 4,
            edge: [p4, p1]
        });
    }
    if (points.length < 2) {
        return points
    }
    const [item1, item2] = points;
    const distance1 = item1.point.distanceTo(currentPoint);
    const distance2 = item2.point.distanceTo(currentPoint);
    //sort Intersection
    if (distance1 < distance2) {
        return [item1, item2];
    }
    return [item2, item1];

}

/**
 * 公共的边
 * @param p 
 * @param crossList 
 * @returns 
 */
function hasSameEdge(cross: CrossPoint, crossList: Array<CrossPoint>) {
    for (let i = 0, len = crossList.length; i < len; i++) {
        const item = crossList[i];
        if (item.edgeIndex === cross.edgeIndex) {
            return true;
        }
    }
    return false;
}

/**
 * 找出边上在给定三角形内的点
 * @param edge 
 * @param p1 
 * @param p2 
 * @param p3 
 * @returns 
 */
function getEdgeVertexInTriangle(edge: [Point, Point], p1: Point, p2: Point, p3: Point) {
    const [pt1, pt2] = edge;
    if (pointInTriangle(pt1, p1, p2, p3)) {
        return pt1;
    }
    return pt2;
}

/**
 * clip path by convex quadrilateral
 * @param path 
 * @param p1 
 * @param p2 
 * @param p3 
 * @param p4 
 * @returns 
 */
export function clipLineByQuadrilateral(path: Array<Point>, p1: Point, p2: Point, p3: Point, p4: Point) {
    const result = [];
    let line = [];
    let nextInView;
    for (let i = 0, len = path.length; i < len; i++) {
        const point1 = path[i], point2 = path[i + 1], point3 = path[i + 2];
        let inView;
        if (i === 0) {
            inView = pointInQuadrilateral(point1, p1, p2, p3, p4);
        } else {
            inView = nextInView;
        }
        if (inView) {
            //点在四边形内
            line.push({
                point: point1
            });
            if (!point2) {
                continue;
            }
            nextInView = pointInQuadrilateral(point2, p1, p2, p3, p4);
            //下一个点在视野内
            if (nextInView) {
                continue;
            }
            const cross = getSegmenQuadrilateralIntersections(point1, point2, p1, p2, p3, p4);
            line.push(...cross);

            if (point3 && cross.length) {
                const p = cross[cross.length - 1];
                const cross1 = getSegmenQuadrilateralIntersections(point2, point3, p1, p2, p3, p4);
                if (cross1.length) {

                    //是否需要加入视野的拐点
                    if (!hasSameEdge(p, cross1)) {
                        line.push({
                            point: getEdgeVertexInTriangle(p.edge, point1, point2, point3)
                        });
                    }
                }
            }
        } else {
            if (!point2) {
                continue;
            }
            nextInView = pointInQuadrilateral(point2, p1, p2, p3, p4);
            //下一个点在视野内
            if (nextInView) {
                const cross = getSegmenQuadrilateralIntersections(point1, point2, p1, p2, p3, p4);
                line.push(...cross)
                continue;
            }

            const cross = getSegmenQuadrilateralIntersections(point1, point2, p1, p2, p3, p4);
            line.push(...cross);
            if (point3 && cross.length) {
                const p = cross[cross.length - 1];
                const cross1 = getSegmenQuadrilateralIntersections(point2, point3, p1, p2, p3, p4);
                if (cross1.length) {
                    //是否需要加入视野的拐点
                    if (!hasSameEdge(p, cross1)) {
                        line.push({
                            point: getEdgeVertexInTriangle(p.edge, point1, point2, point3)
                        });
                    }
                }
                continue;
            }
            if (line.length > 1) {
                result.push(line);
                line = [];
            }
        }
    }
    if (line.length > 1) {
        result.push(line);
    }
    return result;
}

function checkRing(path) {
    const ring = [];
    let idx = 0;
    for (let i = 0, len = path.length; i < len; i++) {
        const point = path[i];
        if (!point) {
            continue;
        }
        if (!point._array) {
            point._array = [point.x, point.y];
        }
        ring[idx] = point._array;
        idx++;
    }
    const first = ring[0], last = ring[ring.length - 1];
    const x1 = first[0], y1 = first[1], x2 = last[0], y2 = last[1];
    if (x1 !== x2 || y1 !== y2) {
        ring.push(first);
    }
    return ring;
}

/**
 * clip polygon by convex quadrilateral
 * @param path 
 * @param p1 
 * @param p2 
 * @param p3 
 * @param p4 
 * @returns 
 */
export function clipPolygonByQuadrilateral(path: Array<Point>, p1: Point, p2: Point, p3: Point, p4: Point) {
    MAP_TEMP_RING[0][0] = p1.x;
    MAP_TEMP_RING[0][1] = p1.y;

    MAP_TEMP_RING[1][0] = p2.x;
    MAP_TEMP_RING[1][1] = p2.y;

    MAP_TEMP_RING[2][0] = p3.x;
    MAP_TEMP_RING[2][1] = p3.y;

    MAP_TEMP_RING[3][0] = p4.x;
    MAP_TEMP_RING[3][1] = p4.y;

    MAP_TEMP_RING[4][0] = p1.x;
    MAP_TEMP_RING[4][1] = p1.y;


    try {
        const ring = checkRing(path);
        const result = polygonClipping.intersection([MAP_TEMP_RING], [ring]);
        if (!result || result.length > 1) {
            return null;
        }
        if (!result[0] || !result[0][0]) {
            return null;
        }
        const points = [];

        const clipPath = result[0][0];
        for (let i = 0, len = clipPath.length; i < len; i++) {
            const p = clipPath[i];
            const point = new Point(p[0], p[1]);
            points[i] = point;
        }
        return points;
    } catch (eror) {
        return null;
    }

}
