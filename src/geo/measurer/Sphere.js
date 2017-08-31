import { extend, wrap } from 'core/util';
import Coordinate from '../Coordinate';
import Common from './Common';

function rad(a) {
    return a * Math.PI / 180;
}

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
        let b = rad(c1.y);
        const d = rad(c2.y),
            e = b - d,
            f = rad(c1.x) - rad(c2.x);
        b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
        b *= this.radius;
        return Math.round(b * 1E5) / 1E5;
    }

    measureArea(coordinates) {
        const a = this.radius * Math.PI / 180;
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
            b += e.x * a * Math.cos(e.y * Math.PI / 180) * f.y * a - f.x * a * Math.cos(f.y * Math.PI / 180) * e.y * a;
        }
        d = c[i];
        c = c[0];
        b += d.x * a * Math.cos(d.y * Math.PI / 180) * c.y * a - c.x * a * Math.cos(c.y * Math.PI / 180) * d.y * a;
        return 0.5 * Math.abs(b);
    }

    locate(c, xDist, yDist) {
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
        let ry = rad(c.y);
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
            let rx = rad(c.x);
            const sx = 2 * Math.sqrt(Math.pow(Math.sin(dx / (2 * this.radius)), 2) / Math.pow(Math.cos(ry), 2));
            rx = rx + sx * (xDist > 0 ? 1 : -1);
            x = wrap(rx * 180 / Math.PI, -180, 180);
        } else {
            x = c.x;
        }
        return new Coordinate(x, y);
    }
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
    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {Coordinate}
     */
    locate() {
        return this.sphere.locate.apply(this.sphere, arguments);
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
    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {Coordinate} c     - source coordinate
     * @param  {Number} xDist              - x-axis distance
     * @param  {Number} yDist              - y-axis distance
     * @return {Coordinate}
     */
    locate() {
        return this.sphere.locate.apply(this.sphere, arguments);
    }
}, Common);
