import { extend, toDegree, toRadian } from '../../core/util/common';
import { wrap } from '../../core/util/util';
import Coordinate, { type CoordinateJson } from '../Coordinate';
import Common, { type CommonMeasurer } from './Common';
import type { WithNull } from '../../types/typings';

type CoordsLike = Coordinate | CoordinateJson;

/**
 * 具有 Sphere 通用测量方法的辅助类。
 *
 * @english
 * A helper class with common measure methods for Sphere.
 * @group measurer
 * @private
 */
class Sphere {
    public radius: number;

    /**
     * @param radius Sphere's radius
     */
    constructor(radius: number) {
        this.radius = radius;
    }

    /**
     * 计算两个坐标之间的距离
     *
     * @english
     * Measure the length between 2 coordinates.
     * @param c1
     * @param c2
     */
    measureLenBetween(c1: CoordsLike, c2: CoordsLike): number {
        if (!c1 || !c2) {
            return 0;
        }
        let b = toRadian(c1.y);
        const d = toRadian(c2.y),
            e = b - d,
            f = toRadian(c1.x) - toRadian(c2.x);
        b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
        b *= this.radius;
        return b;
    }

    /**
     * 测量给定闭合坐标的面积
     *
     * @english
     * Measure the area closed by the given coordinates.
     * @param coordinates
     */
    measureArea(coordinates: CoordsLike[]) {
        const a = toRadian(this.radius);
        let b = 0;
        const c = coordinates;
        const d = c.length;
        if (d < 3) {
            return 0;
        }
        let i: number;
        for (i = 0; i < d - 1; i++) {
            const e = c[i],
                f = c[i + 1];
            b += e.x * a * Math.cos(toRadian(e.y)) * f.y * a - f.x * a * Math.cos(toRadian(f.y)) * e.y * a;
        }
        const e = c[i];
        const f = c[0];
        b += e.x * a * Math.cos(toRadian(e.y)) * f.y * a - f.x * a * Math.cos(toRadian(f.y)) * e.y * a;
        return 0.5 * Math.abs(b);
    }

    /**
     * 使用 x 轴距离和 y 轴距离从给定源坐标定位坐标
     * @english
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param c
     * @param xDist
     * @param yDist
     * @param out
     */
    locate(c: CoordsLike, xDist: number, yDist: number, out?: Coordinate) {
        out = out || new Coordinate(0, 0);
        out.set(c.x, c.y);
        return this._locate(out, xDist, yDist);
    }

    /**
     * 使用 x 轴距离和 y 轴距离从给定源坐标定位坐标
     * @english
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param c     - source coordinate
     * @param xDist     - x-axis distance
     * @param yDist     - y-axis distance
     * @private
     */
    _locate(c: Coordinate, xDist: number, yDist: number): WithNull<Coordinate> {
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
        let x: number, y: number;
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

    /**
     * 绕枢轴旋转给定角度的坐标
     * @english
     * Rotate a coordinate of given angle around pivot
     * @param c  - source coordinate
     * @param pivot - pivot
     * @param angle - angle in degree
     */
    rotate(c: CoordsLike, pivot: Coordinate, angle: number) {
        const coordinate = new Coordinate(c);
        return this._rotate(coordinate, pivot, angle);
    }

    /**
     * 绕枢轴旋转给定角度的坐标
     * @english
     * Rotate a coordinate of given angle around pivot
     * @param c  - source coordinate
     * @param pivot - pivot
     * @param angle - angle in degree
     * @private
     */
    _rotate(c: Coordinate, pivot: Coordinate, angle: number) {
        const initialAngle = rhumbBearing(pivot, c);
        const finalAngle = initialAngle - angle;
        const distance = this.measureLenBetween(pivot, c);
        c.x = pivot.x;
        c.y = pivot.y;
        return calculateRhumbDestination(c, distance, finalAngle, this.radius);
    }
}

// from turf.js
function rhumbBearing(start: CoordsLike, end: CoordsLike, options: Record<string, any> = {}) {
    let bear360: number;
    if (options.final) bear360 = calculateRhumbBearing(end, start);
    else bear360 = calculateRhumbBearing(start, end);

    return (bear360 > 180) ? -(360 - bear360) : bear360;
}

function calculateRhumbBearing(from: CoordsLike, to: CoordsLike) {
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

function calculateRhumbDestination(origin: Coordinate, distance: number, bearing: number, radius: number) {
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

const wgs84 = {
    'measure': 'EPSG:4326',
    sphere: new Sphere(6378137),

    /**
     * 计算两个坐标之间的距离
     *
     * @english
     * Measure the length between 2 coordinates.
     * @param c1
     * @param c2
     */
    measureLenBetween(c1: CoordsLike, c2: CoordsLike): number {
        return this.sphere.measureLenBetween(c1, c2);
    },

    /**
     * 计算给定闭合坐标的面积
     *
     * @english
     * Measure the area closed by the given coordinates.
     * @param coordinates
     */
    measureArea(coordinates: Coordinate[]): number {
        return this.sphere.measureArea.call(this.sphere, coordinates);
    },

    _locate(c: CoordsLike, xDist: number, yDist: number) {
        return this.sphere._locate.call(this.sphere, c, xDist, yDist);
    },

    /**
     * 使用 x 轴距离和 y 轴距离从给定源坐标定位坐标。
     * @english
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param c - source coordinate
     * @param xDist - x-axis distance
     * @param yDist - y-axis distance
     * @param out - out
     */
    locate(c: CoordsLike, xDist: number, yDist: number, out?: Coordinate) {
        return this.sphere.locate.call(this.sphere, c, xDist, yDist, out);
    },

    _rotate(c: Coordinate, pivot: Coordinate, angle: number) {
        return this.sphere._rotate.call(this.sphere, c, pivot, angle);
    },

    /**
     * 绕枢轴旋转给定角度的坐标
     * @english
     * Rotate a coordinate of given angle around pivot
     * @param c  - source coordinate
     * @param pivot - pivot
     * @param angle - angle in degree
     */
    rotate(c: CoordsLike, pivot: Coordinate, angle: number) {
        return this.sphere.rotate.call(this.sphere, c, pivot, angle);
    }
}

/**
 * WGS84 椭球球体
 * @english
 * WGS84 Sphere measurer.
 * @category geo
 * @protected
 * @group measurer
 * @module WGS84Sphere
 * {@inheritDoc measurer.Common}
 */
export const WGS84Sphere = extend<typeof wgs84, CommonMeasurer>(wgs84, Common);

const baidu = {
    'measure': 'BAIDU',
    sphere: new Sphere(6370996.81),

    /**
     * 计算两个坐标之间的距离
     *
     * @english
     * Measure the length between 2 coordinates.
     * @param c1
     * @param c2
     */
    measureLenBetween(c1: CoordsLike, c2: CoordsLike): number {
        return this.sphere.measureLenBetween.call(this.sphere, c1, c2);
    },

    /**
     * 计算给定闭合坐标的面积
     *
     * @english
     * Measure the area closed by the given coordinates.
     * @param coordinates
     */
    measureArea(coordinates: CoordsLike[]): number {
        return this.sphere.measureArea.call(this.sphere, coordinates);
    },

    _locate(c: Coordinate, xDist: number, yDist: number) {
        return this.sphere._locate.call(this.sphere, c, xDist, yDist);
    },

    /**
     * 使用 x 轴距离和 y 轴距离从给定源坐标定位坐标。
     * @english
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param c - source coordinate
     * @param xDist - x-axis distance
     * @param yDist - y-axis distance
     * @param out - out
     */
    locate(c: CoordsLike, xDist: number, yDist: number, out?: Coordinate) {
        return this.sphere.locate.call(this.sphere, c, xDist, yDist, out);
    },

    _rotate(c: Coordinate, pivot: Coordinate, angle: number) {
        return this.sphere._rotate.call(this.sphere, c, pivot, angle);
    },

    /**
     * 绕枢轴旋转给定角度的坐标
     * @english
     * Rotate a coordinate of given angle around pivot
     * @param c  - source coordinate
     * @param pivot - pivot
     * @param angle - angle in degree
     */
    rotate(c: CoordsLike, pivot: Coordinate, angle: number) {
        return this.sphere.rotate.call(this.sphere, c, pivot, angle);
    }
};

/**
 * 百度地图所使用的椭球体
 *
 * @english
 * Baidu sphere measurer
 * @category geo
 * @protected
 * @group measurer
 * @module BaiduSphere
 * {@inheritDoc measurer.Common}
 */
export const BaiduSphere = extend<typeof baidu, CommonMeasurer>(baidu, Common);

export type BaiduSphereType = typeof BaiduSphere;
export type WGS84SphereType = typeof WGS84Sphere;
