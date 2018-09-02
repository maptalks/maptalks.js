import { extend } from '../../core/util';
import Coordinate from '../Coordinate';
import Point from '../Point';
import Common from './Common';
/**
 * Identity measurer, a measurer for Cartesian coordinate system.
 *
 * @class
 * @category geo
 * @protected
 * @memberOf measurer
 * @name Identity
 * @mixes measurer.Common
 */
export default extend(/** @lends measurer.Identity */{
    /**
     * the code of the measurer
     * @static
     * @type {String}
     */
    'measure': 'IDENTITY',
    /**
     * Measure the length between 2 coordinates.
     * @param  {Coordinate} c1
     * @param  {Coordinate} c2
     * @return {Number}
     */
    measureLenBetween: function (c1, c2) {
        if (!c1 || !c2) {
            return 0;
        }
        try {
            return Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));
        } catch (err) {
            return 0;
        }
    },
    /**
     * Measure the area closed by the given coordinates.
     * @param  {Coordinate[]} coordinates
     * @return {number}
     */
    measureArea: function (coordinates) {
        if (!Array.isArray(coordinates)) {
            return 0;
        }
        let area = 0;
        for (let i = 0, len = coordinates.length; i < len; i++) {
            const c1 = coordinates[i];
            let c2 = null;
            if (i === len - 1) {
                c2 = coordinates[0];
            } else {
                c2 = coordinates[i + 1];
            }
            area += c1.x * c2.y - c1.y * c2.x;
        }
        return Math.abs(area / 2);
    },

    locate : function (c, xDist, yDist) {
        c = new Coordinate(c.x, c.y);
        return this._locate(c, xDist, yDist);
    },

    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {Coordinate} c     - source coordinate
     * @param  {Number} xDist     - x-axis distance
     * @param  {Number} yDist     - y-axis distance
     * @return {Coordinate}
     */
    _locate: function (c, xDist, yDist) {
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
        c.x = c.x + xDist;
        c.y = c.y + yDist;
        return c;
    },

    rotate : function (c, pivot, angle) {
        c = new Coordinate(c.x, c.y);
        return this._rotate(c, pivot, angle);
    },

    /**
     * Rotate a coordinate of given angle around pivot
     * @param {Coordinate} c  - source coordinate
     * @param {Coordinate} pivot - pivot
     * @param {Number} angle - angle in degree
     * @return {Coordinate}
     */
    _rotate : function () {
        const tmp = new Point(0, 0);
        return function (c, pivot, angle) {
            tmp.x = c.x - pivot.x;
            tmp.y = c.y - pivot.y;
            tmp._rotate(angle * Math.PI / 180);
            c.x = pivot.x + tmp.x;
            c.y = pivot.y + tmp.y;
            return c;
        };
    }()
}, Common);
