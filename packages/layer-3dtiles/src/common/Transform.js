//---------------------------
// Cesium Codes for catersian and quaternion transformation
//
// All credit goes to Cesium team and Cesium Contributors
// LICENSE : Apache License
//---------------------------
import { vec3 } from 'gl-matrix';
import { toDegree, sign } from './Util';


//reusable variables for radianToCartesian3
const scratchN = new Array(3),
    scratchK = new Array(3);

const wgs84RadiiSquared = [6378137.0 * 6378137.0, 6378137.0 * 6378137.0, 6356752.3142451793 * 6356752.3142451793];

/**
 * from Cesium
 * Convert radians to Cartesian3 coordinate
 * from Cesium Cartesian3.fromRadians
 * @param {Number} longitude in radians
 * @param {Number} latitude in radians
 * @param {Number} height in meters
 * @param {Number} radius earth sphere's radius
 * @returns {Number[]} coordinate in Cartesian3
 */
export function radianToCartesian3(out, longitude, latitude, height) {
    const radiiSquared = wgs84RadiiSquared;

    const cosLatitude = Math.cos(latitude);
    scratchN[0] = cosLatitude * Math.cos(longitude);
    scratchN[1] = cosLatitude * Math.sin(longitude);
    scratchN[2] = Math.sin(latitude);
    normalizeCartesian(scratchN, scratchN);

    vec3.multiply(scratchK, radiiSquared, scratchN);
    const gamma = Math.sqrt(vec3.dot(scratchN, scratchK));
    divideByScalar(scratchK, scratchK, gamma);
    vec3.scale(scratchN, scratchN, height);

    return vec3.add(out, scratchK, scratchN);
}

//reusable variables for cartesian3ToDegree
const wgs84OneOverRadii = [1.0 / 6378137.0, 1.0 / 6378137.0, 1.0 / 6356752.3142451793];
const wgs84OneOverRadiiSquared = [1.0 / (6378137 * 6378137), 1.0 / (6378137 * 6378137), 1.0 / (6356752.3142451793 * 6356752.3142451793)];

const cartesianToCartographicP = new Array(3);
const cartesianToCartographicN = new Array(3);
const cartesianToCartographicH = new Array(3);

/**
 * from Cesium
 * Creates a new Cartographic instance from a Cartesian position. The values in the
 * resulting object will be in radians.
 *
 * @param cartesian The Cartesian position to convert to cartographic representation.
 * @returns {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
 */
export function cartesian3ToDegree(result, cartesian) {
    const oneOverRadii = wgs84OneOverRadii;
    const oneOverRadiiSquared = wgs84OneOverRadiiSquared;
    const centerToleranceSquared = 0.1;

    //`cartesian is required.` is thrown from scaleToGeodeticSurface
    const p = scaleToGeodeticSurface(cartesianToCartographicP, cartesian, oneOverRadii, oneOverRadiiSquared, centerToleranceSquared);

    let n = vec3.mul(cartesianToCartographicN, p, oneOverRadiiSquared);
    n = normalizeCartesian(n, n);

    const h = vec3.sub(cartesianToCartographicH, cartesian, p);

    const longitude = Math.atan2(n[1], n[0]);
    const latitude = Math.asin(n[2]);
    const height = sign(vec3.dot(h, cartesian)) * magnitude(h);

    result[0] = toDegree(longitude);
    result[1] = toDegree(latitude);
    result[2] = height;
    return result;
}

//reusable variables for scaleToGeodeticSurface
const scaleToGeodeticSurfaceIntersection = new Array(3);
const scaleToGeodeticSurfaceGradient = new Array(3);
const EPSILON12 = 1E-12;

/**
 * from Cesium
 * Scales the provided Cartesian position along the geodetic surface normal
 * so that it is on the surface of this ellipsoid.  If the position is
 * at the center of the ellipsoid, this function returns undefined.
 *
 * @param {Cartesian3} cartesian The Cartesian position to scale.
 * @param {Cartesian3} oneOverRadii One over radii of the ellipsoid.
 * @param {Cartesian3} oneOverRadiiSquared One over radii squared of the ellipsoid.
 * @param {Number} centerToleranceSquared Tolerance for closeness to the center.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter, a new Cartesian3 instance if none was provided, or undefined if the position is at the center.
 *
 * @exports scaleToGeodeticSurface
 *
 * @private
 */
function scaleToGeodeticSurface(result, cartesian, oneOverRadii, oneOverRadiiSquared, centerToleranceSquared) {

    const positionX = cartesian[0];
    const positionY = cartesian[1];
    const positionZ = cartesian[2];

    const oneOverRadiiX = oneOverRadii[0];
    const oneOverRadiiY = oneOverRadii[1];
    const oneOverRadiiZ = oneOverRadii[2];

    const x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
    const y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
    const z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;

    // Compute the squared ellipsoid norm.
    const squaredNorm = x2 + y2 + z2;
    const ratio = Math.sqrt(1.0 / squaredNorm);

    // As an initial approximation, assume that the radial intersection is the projection point.
    // const intersection = Cartesian3.multiplyByScalar(cartesian, ratio, scaleToGeodeticSurfaceIntersection);
    const intersection = vec3.scale(scaleToGeodeticSurfaceIntersection, cartesian, ratio);

    // If the position is near the center, the iteration will not converge.
    if (squaredNorm < centerToleranceSquared) {
        return !isFinite(ratio) ? undefined : intersection;
    }

    const oneOverRadiiSquaredX = oneOverRadiiSquared[0];
    const oneOverRadiiSquaredY = oneOverRadiiSquared[1];
    const oneOverRadiiSquaredZ = oneOverRadiiSquared[2];

    // Use the gradient at the intersection point in place of the true unit normal.
    // The difference in magnitude will be absorbed in the multiplier.
    const gradient = scaleToGeodeticSurfaceGradient;
    gradient[0] = intersection[0] * oneOverRadiiSquaredX * 2.0;
    gradient[1] = intersection[1] * oneOverRadiiSquaredY * 2.0;
    gradient[2] = intersection[2] * oneOverRadiiSquaredZ * 2.0;

    // Compute the initial guess at the normal vector multiplier, lambda.
    let lambda = (1.0 - ratio) * magnitude(cartesian) / (0.5 * magnitude(gradient));
    let correction = 0.0;

    let func;
    let denominator;
    let xMultiplier;
    let yMultiplier;
    let zMultiplier;
    let xMultiplier2;
    let yMultiplier2;
    let zMultiplier2;
    let xMultiplier3;
    let yMultiplier3;
    let zMultiplier3;

    do {
        lambda -= correction;

        xMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredX);
        yMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredY);
        zMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredZ);

        xMultiplier2 = xMultiplier * xMultiplier;
        yMultiplier2 = yMultiplier * yMultiplier;
        zMultiplier2 = zMultiplier * zMultiplier;

        xMultiplier3 = xMultiplier2 * xMultiplier;
        yMultiplier3 = yMultiplier2 * yMultiplier;
        zMultiplier3 = zMultiplier2 * zMultiplier;

        func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1.0;

        // "denominator" here refers to the use of this expression in the velocity and acceleration
        // computations in the sections to follow.
        denominator = x2 * xMultiplier3 * oneOverRadiiSquaredX + y2 * yMultiplier3 * oneOverRadiiSquaredY + z2 * zMultiplier3 * oneOverRadiiSquaredZ;

        const derivative = -2.0 * denominator;

        correction = func / derivative;
    } while (Math.abs(func) > EPSILON12);

    result[0] = positionX * xMultiplier;
    result[1] = positionY * yMultiplier;
    result[2] = positionZ * zMultiplier;
    return result;
}

function magnitude(v) {
    return vec3.length(v);
}

function divideByScalar(result, cartesian, scalar) {
    result[0] = cartesian[0] / scalar;
    result[1] = cartesian[1] / scalar;
    result[2] = cartesian[2] / scalar;
    return result;
}

export function normalizeCartesian(out, a) {
    const x = a[0],
        y = a[1],
        z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
        len = Math.sqrt(len);
        out[0] = a[0] / len;
        out[1] = a[1] / len;
        out[2] = a[2] / len;
    }
    return out;
}

export function geodeticSurfaceNormal(origin, out) {
    vec3.multiply(
        out,
        origin,
        wgs84OneOverRadiiSquared
    );
    return vec3.normalize(out, out);
}


export function geodeticSurfaceNormalCartographic(
    cartographic,
    result
) {
    const longitude = cartographic[0];
    const latitude = cartographic[1];
    const cosLatitude = Math.cos(latitude);

    const x = cosLatitude * Math.cos(longitude);
    const y = cosLatitude * Math.sin(longitude);
    const z = Math.sin(latitude);

    result.x = x;
    result.y = y;
    result.z = z;
    return vec3.normalize(result, result);
}
