import concaveman from './concaveman.js';
import { project } from '../builder/projection.js';
import { PackUtil } from '@maptalks/vector-packer';

// Computing oriented minimum bounding boxes
// credits of https://github.com/geidav/ombb-rotating-calipers

//------------Vector.js------------------
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    normalize() {
        const len = this.length();
        this.x /= len;
        this.y /= len;
    }

    negate() {
        this.x = -this.x;
        this.y = -this.y;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    diff(vec) {
        return new Vector(this.x - vec.x, this.y - vec.y);
    }

    distance(vec) {
        const x = this.x - vec.x;
        const y = this.y - vec.y;
        return Math.sqrt(x * x + y * y);
    }

    dot(vec) {
        return this.x * vec.x + this.y * vec.y;
    }

    equals(vec) {
        return this.x === vec.x && this.y === vec.y;
    }

    orthogonal() {
        return new Vector(this.y, -this.x);
    }

}

//-------------convexhull.js---------------------
const ON = 0;
const LEFT = 1;
const RIGHT = 2;
const ALMOST_ZERO = 0.00001;

function GetSideOfLine(lineStart, lineEnd, point) {
    const d = (lineEnd.x - lineStart.x) * (point.y - lineStart.y) - (lineEnd.y - lineStart.y) * (point.x - lineStart.x);
    return (d > ALMOST_ZERO ? LEFT : (d < -ALMOST_ZERO ? RIGHT : ON));
}

// returns convex hull in CCW order
// (required by Rotating Calipers implementation)
function CalcConvexHull(points) {
    // bad input?
    if (points.length < 3)
        return points;

    // find first hull point
    let hullPt = points[0];
    const convexHull = [];

    for (let i = 1; i < points.length; i++) {
        // perform lexicographical compare
        if (points[i].x < hullPt.x)
            hullPt = points[i];
        else if (Math.abs(points[i].x - hullPt.x) < ALMOST_ZERO) // equal
            if (points[i].y < hullPt.y)
                hullPt = points[i];
    }

    let endPt = points[0];
    // find remaining hull points
    do {
        convexHull.unshift(hullPt.clone());

        for (let j = 1; j < points.length; j++) {
            const side = GetSideOfLine(hullPt, endPt, points[j]);

            // in case point lies on line take the one further away.
            // this fixes the collinearity problem.
            if (endPt.equals(hullPt) || (side === LEFT || (side === ON && hullPt.distance(points[j]) > hullPt.distance(endPt))))
                endPt = points[j];
        }

        hullPt = endPt;
    }
    while (!endPt.equals(convexHull[convexHull.length - 1]));

    return convexHull;
}

//-------------ombb.js---------------------

function IntersectLines(start0, dir0, start1, dir1) {
    const dd = dir0.x * dir1.y - dir0.y * dir1.x;
    // dd=0 => lines are parallel. we don't care as our lines are never parallel.
    const dx = start1.x - start0.x;
    const dy = start1.y - start0.y;
    const t = (dx * dir1.y - dy * dir1.x) / dd;
    return new Vector(start0.x + t * dir0.x, start0.y + t * dir0.y);
}

// computes the minimum area enclosing rectangle
// (aka oriented minimum bounding box)
function CalcOmbb(convexHull) {
    let BestObb;
    this.UpdateOmbb = function(leftStart, leftDir, rightStart, rightDir, topStart, topDir, bottomStart, bottomDir)
    {
        var obbUpperLeft = IntersectLines(leftStart, leftDir, topStart, topDir);
        var obbUpperRight = IntersectLines(rightStart, rightDir, topStart, topDir);
        var obbBottomLeft = IntersectLines(bottomStart, bottomDir, leftStart, leftDir);
        var obbBottomRight = IntersectLines(bottomStart, bottomDir, rightStart, rightDir);
        var distLeftRight = obbUpperLeft.distance(obbUpperRight);
        var distTopBottom = obbUpperLeft.distance(obbBottomLeft);
        var obbArea = distLeftRight*distTopBottom;

        if (obbArea !== 0 && obbArea < this.BestObbArea)
        {
            BestObb = [obbUpperLeft, obbBottomLeft, obbBottomRight, obbUpperRight];
            this.BestObbArea = obbArea;
        }

        // draw rectangle candidates
        // DrawLine(obbUpperLeft.x, obbUpperLeft.y, obbBottomLeft.x, obbBottomLeft.y, "#336699");
        // DrawLine(obbBottomRight.x, obbBottomRight.y, obbUpperRight.x, obbUpperRight.y, "#336699");
        // DrawLine(obbUpperRight.x, obbUpperRight.y, obbUpperLeft.x, obbUpperLeft.y, "#336699");
        // DrawLine(obbBottomLeft.x, obbBottomLeft.y, obbBottomRight.x, obbBottomRight.y, "#336699");
    }

    // initialize attributes
    this.BestObbArea = Number.MAX_VALUE;
    this.BestObb = [];

    // compute directions of convex hull edges
    var edgeDirs = [];

    for (var i=0; i<convexHull.length; i++)
    {
        edgeDirs.push(convexHull[(i+1)%convexHull.length].diff(convexHull[i]));
        edgeDirs[i].normalize();
    }

    // compute extreme points
    var minPt = new Vector(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    var maxPt = new Vector(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    var leftIdx, rightIdx, topIdx, bottomIdx;

    for (var i=0; i<convexHull.length; i++)
    {
        var pt = convexHull[i];

        if (pt.x < minPt.x)
        {
            minPt.x = pt.x;
            leftIdx = i;
        }

        if (pt.x > maxPt.x)
        {
            maxPt.x = pt.x;
            rightIdx = i;
        }

        if (pt.y < minPt.y)
        {
            minPt.y = pt.y;
            bottomIdx = i;
        }

        if (pt.y > maxPt.y)
        {
            maxPt.y = pt.y;
            topIdx = i;
        }
    }

    // initial caliper lines + directions
    //
    //        top
    //      <-------
    //      |      A
    //      |      | right
    // left |      |
    //      V      |
    //      ------->
    //       bottom
    var leftDir = new Vector(0.0, -1);
    var rightDir = new Vector(0, 1);
    var topDir = new Vector(-1, 0);
    var bottomDir = new Vector(1, 0);

    // execute rotating caliper algorithm
    for (var i=0; i<convexHull.length; i++)
    {
        // of course the acos() can be optimized.
        // but it's a JS prototype anyways, so who cares.
        var phis = // 0=left, 1=right, 2=top, 3=bottom
        [
            Math.acos(leftDir.dot(edgeDirs[leftIdx])),
            Math.acos(rightDir.dot(edgeDirs[rightIdx])),
            Math.acos(topDir.dot(edgeDirs[topIdx])),
            Math.acos(bottomDir.dot(edgeDirs[bottomIdx])),
        ];

        var lineWithSmallestAngle = phis.indexOf(Math.min.apply(Math, phis));
        switch (lineWithSmallestAngle)
        {
        case 0: // left
            leftDir = edgeDirs[leftIdx].clone();
            rightDir = leftDir.clone();
            rightDir.negate();
            topDir = leftDir.orthogonal();
            bottomDir = topDir.clone();
            bottomDir.negate();
            leftIdx = (leftIdx+1)%convexHull.length;
            break;
        case 1: // right
            rightDir = edgeDirs[rightIdx].clone();
            leftDir = rightDir.clone();
            leftDir.negate();
            topDir = leftDir.orthogonal();
            bottomDir = topDir.clone();
            bottomDir.negate();
            rightIdx = (rightIdx+1)%convexHull.length;
            break;
        case 2: // top
            topDir = edgeDirs[topIdx].clone();
            bottomDir = topDir.clone();
            bottomDir.negate();
            leftDir = bottomDir.orthogonal();
            rightDir = leftDir.clone();
            rightDir.negate();
            topIdx = (topIdx+1)%convexHull.length;
            break;
        case 3: // bottom
            bottomDir = edgeDirs[bottomIdx].clone();
            topDir = bottomDir.clone();
            topDir.negate();
            leftDir = bottomDir.orthogonal();
            rightDir = leftDir.clone();
            rightDir.negate();
            bottomIdx = (bottomIdx+1)%convexHull.length;
            break;
        }

        this.UpdateOmbb(convexHull[leftIdx], leftDir, convexHull[rightIdx], rightDir, convexHull[topIdx], topDir, convexHull[bottomIdx], bottomDir);
    }

    return BestObb;
}

const VECTORS = [];
const HULL = []

// let ctime = 0;
// let otime = 0;
// let count = 0;
export default function (vertices, start, offset) {
    // const isCoord = Array.isArray(vertices[0]);
    // let t = 0;
    // const points = [];
    // if (isCoord) {
    //     for (let i = start; i < offset; i++) {
    //         if (!VECTORS[t]) {
    //             VECTORS[t] = new Vector(vertices[i][0], -vertices[i][1]);
    //         } else {
    //             VECTORS[t].x = vertices[i][0];
    //             VECTORS[t].y = -vertices[i][1];
    //         }
    //         points.push(VECTORS[t]);
    //         t++;
    //     }
    // } else {
    //     for (let i = start; i < offset; i += 3) {
    //         if (!VECTORS[t]) {
    //             VECTORS[t] = new Vector(vertices[i], vertices[i + 1]);
    //         } else {
    //             VECTORS[t].x = vertices[i];
    //             VECTORS[t].y = vertices[i + 1];
    //         }
    //         points.push(VECTORS[t]);
    //         t++;
    //     }
    // }
    // debugger
    // const now = performance.now();
    // const hull = CalcConvexHull(points);
    // for (let i = start; i < offset; i++) {
    //     vertices[i][1] *= -1;
    // }
    const projectionCode = 'EPSG:3857';
    const hull = concaveman(vertices, Infinity);
    console.log('hull', JSON.stringify(hull));
    // const now1 = performance.now();
    // const elapsed = now1 - now;
    // ctime += elapsed;
    let min = [Infinity, Infinity], max = [-Infinity, -Infinity];
    for (let i = 0; i < hull.length; i++) {
        if (hull[i][0] < min[0]) {
            min[0] = hull[i][0];
        }
        if (hull[i][0] > max[0]) {
            max[0] = hull[i][0];
        }

        if (hull[i][1] < min[1]) {
            min[1] = hull[i][1];
        }
        if (hull[i][1] > max[1]) {
            max[1] = hull[i][1];
        }
    }

    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2];
    project(center, center, projectionCode);

    center[0] = center[1] = 0;

    const projectedCoord = [];

    let convexHull = [];
    let t = 0;
    for (let i = 0; i < hull.length; i++) {
        if (i === hull.length - 1 && hull[i][0] === hull[0][0] && hull[i][1] === hull[0][1]) {
            continue
        }
        project(projectedCoord, hull[i], projectionCode);
        // projectedCoord[0] -= center[0];
        // projectedCoord[1] -= center[1];
        if (!HULL[t]) {
            HULL[t] = new Vector(projectedCoord[0], projectedCoord[1]);
        } else {
            HULL[t].x = projectedCoord[0];
            HULL[t].y = projectedCoord[1];
        }
        convexHull.push(HULL[t]);
        t++;
    }

    if (PackUtil.calculateSignedArea(convexHull) < 0) {
        convexHull = convexHull.reverse();
    }
    // for (let i = start; i < offset; i++) {
    //     vertices[i][1] *= -1;
    // }
    // debugger
    let ombb = CalcOmbb(convexHull); // draws OOBB candidates

    console.log(JSON.stringify(ombb));
    // const elapsed2 = performance.now() - now1;
    // otime += elapsed2;

    // count++;

    // console.log(count, ctime, otime);
    const edge0 = ombb[0].distance(ombb[1]);
    const edge1 = ombb[1].distance(ombb[2]);
    const box = ombb.map(v => [v.x + center[0], v.y + center[1]]);
    console.log('ombb', JSON.stringify(box));
    //宽边开始的序号，0或者1
    box.push(+(edge1 > edge0));
    return box;
}

// let ctime = 0;
// let otime = 0;
// let count = 0;
// export default function (vertices, start, offset) {
//     const points = [];
//     for (let i = start; i < offset; i += 3) {
//         points.push([vertices[i], vertices[i + 1]]);
//     }
//     const now = performance.now();
//     const hull = convexHull(points).map(p => {
//         return new Vector(vertices[start + p * 3], vertices[start + p * 3 + 1]);
//     });

//     // debugger
//     const now1 = performance.now();
//     const elapsed = now1 - now;
//     ctime += elapsed;

//     const ombb = CalcOmbb(hull); // draws OOBB candidates
//     const elapsed2 = performance.now() - now1;
//     otime += elapsed2;
//     count++;
//     console.log(count, +ctime.toFixed(1), +otime.toFixed(1));
//     return ombb;
// }

