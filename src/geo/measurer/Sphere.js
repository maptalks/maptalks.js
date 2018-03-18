import { toRadian, toDegree, extend, wrap } from '../../core/util';
import Coordinate from '../Coordinate';
import Common from './Common';

/**
 * A helper class with common measure methods for Sphere.
 * @memberOf measurer
 * @private
 */
class Sphere {
    /**
     * @param  {Number} radius Sphere's radius
     */
    constructor(radius) {
        this.radius = radius;
    }

    measureLenBetween(c1, c2) {
        if (!c1 || !c2) {
            return 0;
        }
        let b = toRadian(c1.y);
        const d = toRadian(c2.y),
            e = b - d,
            f = toRadian(c1.x) - toRadian(c2.x);
        b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
        b *= this.radius;
        return Math.round(b * 1E5) / 1E5;
    }

    measureArea(coordinates) {
        const a = toRadian(this.radius);
        let b = 0,
            c = coordinates,
            d = c.length;
        if (d < 3) {
            return 0;
        }
        let i;
        for (i = 0; i < d - 1; i++) {
            const e = c[i],
                f = c[i + 1];
            b += e.x * a * Math.cos(toRadian(e.y)) * f.y * a - f.x * a * Math.cos(toRadian(f.y)) * e.y * a;
        }
        d = c[i];
        c = c[0];
        b += d.x * a * Math.cos(toRadian(d.y)) * c.y * a - c.x * a * Math.cos(toRadian(c.y)) * d.y * a;
        return 0.5 * Math.abs(b);
    }

    locate(c, xDist, yDist) {
        c = new Coordinate(c.x, c.y);
        return this._locate(c, xDist, yDist);
    }

    _locate(c, xDist, yDist) {
        if (!c) {
            return null;
        }
        if (!xDist) {
            xDist = 0;
        }
        if (!yDist) {
            yDist = 0;
        }
        if (!xDist && !yDist) {
            return c;
        }
        let x, y;
        let ry = toRadian(c.y);
        if (yDist !== 0) {
            const dy = Math.abs(yDist);
            const sy = Math.sin(dy / (2 * this.radius)) * 2;
            ry = ry + sy * (yDist > 0 ? 1 : -1);
            y = wrap(ry * 180 / Math.PI, -90, 90);
        } else {
            y = c.y;
        }
        if (xDist !== 0) {
            // distance per degree
            const dx = Math.abs(xDist);
            let rx = toRadian(c.x);
            const sx = 2 * Math.sqrt(Math.pow(Math.sin(dx / (2 * this.radius)), 2) / Math.pow(Math.cos(ry), 2));
            rx = rx + sx * (xDist > 0 ? 1 : -1);
            x = wrap(rx * 180 / Math.PI, -180, 180);
        } else {
            x = c.x;
        }
        c.x = x;
        c.y = y;
        return c;
    }

    rotate(c, pivot, angle) {
        c = new Coordinate(c);
        return this._rotate(c, pivot, angle);
    }

    /**
     * Rotate a coordinate of given angle around pivot
     * @param {Coordinate} c  - source coordinate
     * @param {Coordinate} pivot - pivot
     * @param {Number} angle - angle in degree
     * @return {Coordinate}
     */
    _rotate(c, pivot, angle) {
        const initialAngle = rhumbBearing(pivot, c);
        const finalAngle = initialAngle - angle;
        const distance = this.measureLenBetween(pivot, c);
        c.x = pivot.x;
        c.y = pivot.y;
        return calculateRhumbDestination(c, distance, finalAngle, this.radius);
    }
}

// from turf.js
function rhumbBearing(start, end, options = {}) {
    let bear360;
    if (options.final) bear360 = calculateRhumbBearing(end, start);
    else bear360 = calculateRhumbBearing(start, end);

    const bear180 = (bear360 > 180) ? -(360 - bear360) : bear360;

    return bear180;
}

function calculateRhumbBearing(from, to) {
    // φ => phi
    // Δλ => deltaLambda
    // Δψ => deltaPsi
    // θ => theta
    const phi1 = toRadian(from.y);
    const phi2 = toRadian(to.y);
    let deltaLambda = toRadian((to.x - from.x));
    // if deltaLambdaon over 180° take shorter rhumb line across the anti-meridian:
    if (deltaLambda > Math.PI) deltaLambda -= 2 * Math.PI;
    if (deltaLambda < -Math.PI) deltaLambda += 2 * Math.PI;

    const deltaPsi = Math.log(Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4));

    const theta = Math.atan2(deltaLambda, deltaPsi);

    return (toDegree(theta) + 360) % 360;
}

function calculateRhumbDestination(origin, distance, bearing, radius) {
    // φ => phi
    // λ => lambda
    // ψ => psi
    // Δ => Delta
    // δ => delta
    // θ => theta

    const delta = distance / radius; // angular distance in radians
    const lambda1 = origin.x * Math.PI / 180; // to radians, but without normalize to 𝜋
    const phi1 = toRadian(origin.y);
    const theta = toRadian(bearing);

    const DeltaPhi = delta * Math.cos(theta);
    let phi2 = phi1 + DeltaPhi;

    // check for some daft bugger going past the pole, normalise latitude if so
    if (Math.abs(phi2) > Math.PI / 2) phi2 = phi2 > 0 ? Math.PI - phi2 : -Math.PI - phi2;

    const DeltaPsi = Math.log(Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4));
    const q = Math.abs(DeltaPsi) > 10e-12 ? DeltaPhi / DeltaPsi : Math.cos(phi1); // E-W course becomes ill-conditioned with 0/0
    const DeltaLambda = delta * Math.sin(theta) / q;
    const lambda2 = lambda1 + DeltaLambda;

    origin.x = ((lambda2 * 180 / Math.PI) + 540) % 360 - 180;
    origin.y = phi2 * 180 / Math.PI;
    return origin; // normalise to −180..+180°
}

/**
 * WGS84 Sphere measurer.
 * @class
 * @category geo
 * @protected
 * @memberOf measurer
 * @name WGS84Sphere
 * @mixes measurer.Common
 */
export const WGS84Sphere = extend(/** @lends measurer.WGS84Sphere */{
    'measure': 'EPSG:4326',
    sphere: new Sphere(6378137),
    /**
     * Measure the length between 2 coordinates.
     * @param  {Coordinate} c1
     * @param  {Coordinate} c2
     * @return {Number}
     */
    measureLenBetween() {
        return this.sphere.measureLenBetween.apply(this.sphere, arguments);
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {Coordinate[]} coordinates
     * @return {number}
     */
    measureArea() {
        return this.sphere.measureArea.apply(this.sphere, arguments);
    },

    _locate() {
        return this.sphere._locate.apply(this.sphere, arguments);
    },

    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {Coordinate}
     */
    locate() {
        return this.sphere.locate.apply(this.sphere, arguments);
    },

    _rotate() {
        return this.sphere._rotate.apply(this.sphere, arguments);
    },

    /**
     * Rotate a coordinate of given angle around pivot
     * @param {Coordinate} c  - source coordinate
     * @param {Coordinate} pivot - pivot
     * @param {Number} angle - angle in degree
     * @return {Coordinate}
     */
    rotate() {
        return this.sphere.rotate.apply(this.sphere, arguments);
    }
}, Common);

/**
 * Baidu sphere measurer
 * @class
 * @category geo
 * @protected
 * @memberOf measurer
 * @name BaiduSphere
 * @mixes measurer.Common
 */
export const BaiduSphere = extend(/** @lends measurer.BaiduSphere */{
    'measure': 'BAIDU',
    sphere: new Sphere(6370996.81),
    /**
     * Measure the length between 2 coordinates.
     * @param  {Coordinate} c1
     * @param  {Coordinate} c2
     * @return {Number}
     */
    measureLenBetween() {
        return this.sphere.measureLenBetween.apply(this.sphere, arguments);
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {Coordinate[]} coordinates
     * @return {number}
     */
    measureArea() {
        return this.sphere.measureArea.apply(this.sphere, arguments);
    },

    _locate() {
        return this.sphere._locate.apply(this.sphere, arguments);
    },

    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {Coordinate}
     */
    locate() {
        return this.sphere.locate.apply(this.sphere, arguments);
    },

    _rotate() {
        return this.sphere._rotate.apply(this.sphere, arguments);
    },

    /**
     * Rotate a coordinate of given angle around pivot
     * @param {Coordinate} c  - source coordinate
     * @param {Coordinate} pivot - pivot
     * @param {Number} angle - angle in degree
     * @return {Coordinate}
     */
    rotate() {
        return this.sphere.rotate.apply(this.sphere, arguments);
    }
}, Common);
