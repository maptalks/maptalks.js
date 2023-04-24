import { vec3 } from 'gl-matrix';

// const getPlanesRight = [];
// const getPlanesNearCenter = [];

// function computeCullingVolume(position, direction, up) {


//     var planes = this._cullingVolume.planes;

//     var t = this.top;
//     var b = this.bottom;
//     var r = this.right;
//     var l = this.left;
//     var n = this.near;
//     var f = this.far;

//     var right = vec3.cross(getPlanesRight, direction, up);

//     var nearCenter = getPlanesNearCenter;
//     vec3.scale(n, nearCenter, direction);
//     Cartesian3.add(position, nearCenter, nearCenter);

//     var farCenter = getPlanesFarCenter;
//     Cartesian3.multiplyByScalar(direction, f, farCenter);
//     Cartesian3.add(position, farCenter, farCenter);

//     var normal = getPlanesNormal;

//     //Left plane computation
//     Cartesian3.multiplyByScalar(right, l, normal);
//     Cartesian3.add(nearCenter, normal, normal);
//     Cartesian3.subtract(normal, position, normal);
//     Cartesian3.normalize(normal, normal);
//     Cartesian3.cross(normal, up, normal);
//     Cartesian3.normalize(normal, normal);

//     var plane = planes[0];
//     if (!defined(plane)) {
//         plane = planes[0] = new Cartesian4();
//     }
//     plane.x = normal.x;
//     plane.y = normal.y;
//     plane.z = normal.z;
//     plane.w = -Cartesian3.dot(normal, position);

//     //Right plane computation
//     Cartesian3.multiplyByScalar(right, r, normal);
//     Cartesian3.add(nearCenter, normal, normal);
//     Cartesian3.subtract(normal, position, normal);
//     Cartesian3.cross(up, normal, normal);
//     Cartesian3.normalize(normal, normal);

//     plane = planes[1];
//     if (!defined(plane)) {
//         plane = planes[1] = new Cartesian4();
//     }
//     plane.x = normal.x;
//     plane.y = normal.y;
//     plane.z = normal.z;
//     plane.w = -Cartesian3.dot(normal, position);

//     //Bottom plane computation
//     Cartesian3.multiplyByScalar(up, b, normal);
//     Cartesian3.add(nearCenter, normal, normal);
//     Cartesian3.subtract(normal, position, normal);
//     Cartesian3.cross(right, normal, normal);
//     Cartesian3.normalize(normal, normal);

//     plane = planes[2];
//     if (!defined(plane)) {
//         plane = planes[2] = new Cartesian4();
//     }
//     plane.x = normal.x;
//     plane.y = normal.y;
//     plane.z = normal.z;
//     plane.w = -Cartesian3.dot(normal, position);

//     //Top plane computation
//     Cartesian3.multiplyByScalar(up, t, normal);
//     Cartesian3.add(nearCenter, normal, normal);
//     Cartesian3.subtract(normal, position, normal);
//     Cartesian3.cross(normal, right, normal);
//     Cartesian3.normalize(normal, normal);

//     plane = planes[3];
//     if (!defined(plane)) {
//         plane = planes[3] = new Cartesian4();
//     }
//     plane.x = normal.x;
//     plane.y = normal.y;
//     plane.z = normal.z;
//     plane.w = -Cartesian3.dot(normal, position);

//     //Near plane computation
//     plane = planes[4];
//     if (!defined(plane)) {
//         plane = planes[4] = new Cartesian4();
//     }
//     plane.x = direction.x;
//     plane.y = direction.y;
//     plane.z = direction.z;
//     plane.w = -Cartesian3.dot(direction, nearCenter);

//     //Far plane computation
//     Cartesian3.negate(direction, normal);

//     plane = planes[5];
//     if (!defined(plane)) {
//         plane = planes[5] = new Cartesian4();
//     }
//     plane.x = normal.x;
//     plane.y = normal.y;
//     plane.z = normal.z;
//     plane.w = -Cartesian3.dot(normal, farCenter);

//     return this._cullingVolume;
// }

function getMatrix3Column(out, mat, idx) {
    out[0] = mat[idx];
    out[1] = mat[idx + 3];
    out[2] = mat[idx + 6];
    return out;
}

export function distanceToCamera(center, halfAxes, cameraPosition) {
    return Math.sqrt(distanceSquaredTo(center, halfAxes, cameraPosition));
}

const scratchOffset = [];
const scratchCartesianU = [];
const scratchCartesianV = [];
const scratchCartesianW = [];
const scratchPPrime = [];

//from Cesium's OrientedBoundingBox.distanceSquaredTo
function distanceSquaredTo(center, halfAxes, cartesian) {
    // See Geometric Tools for Computer Graphics 10.4.2
    const offset = vec3.subtract(scratchOffset, cartesian, center);

    // var halfAxes = halfAxes;
    const u = getMatrix3Column(scratchCartesianU, halfAxes, 0);
    const v = getMatrix3Column(scratchCartesianV, halfAxes, 1);
    const w = getMatrix3Column(scratchCartesianW, halfAxes, 2);

    const uHalf = vec3.len(u);
    const vHalf = vec3.len(v);
    const wHalf = vec3.len(w);

    vec3.normalize(u, u);
    vec3.normalize(v, v);
    vec3.normalize(w, w);

    const pPrime = scratchPPrime;
    pPrime[0] = vec3.dot(offset, u);
    pPrime[1] = vec3.dot(offset, v);
    pPrime[2] = vec3.dot(offset, w);

    let distanceSquared = 0.0;
    let d;

    if (pPrime[0] < -uHalf) {
        d = pPrime[0] + uHalf;
        distanceSquared += d * d;
    } else if (pPrime[0] > uHalf) {
        d = pPrime[0] - uHalf;
        distanceSquared += d * d;
    }

    if (pPrime[1] < -vHalf) {
        d = pPrime[1] + vHalf;
        distanceSquared += d * d;
    } else if (pPrime[1] > vHalf) {
        d = pPrime[1] - vHalf;
        distanceSquared += d * d;
    }

    if (pPrime[2] < -wHalf) {
        d = pPrime[2] + wHalf;
        distanceSquared += d * d;
    } else if (pPrime[2] > wHalf) {
        d = pPrime[2] - wHalf;
        distanceSquared += d * d;
    }

    return distanceSquared;
}
