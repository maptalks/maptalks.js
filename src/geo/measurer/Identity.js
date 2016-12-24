import { isArrayHasData } from 'core/util';
import Coordinate from 'geo/Coordinate';

/**
 * Identity measurer, a measurer for Cartesian coordinate system.
 *
 * @class
 * @category geo
 * @protected
 * @memberOf measurer
 * @name Identity
 */
export const Identity = {
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
     * @static
     */
    measureLength: function (c1, c2) {
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
     * @static
     */
    measureArea: function (coordinates) {
        if (!isArrayHasData(coordinates)) {
            return 0;
        }
        var area = 0;
        for (var i = 0, len = coordinates.length; i < len; i++) {
            var c1 = coordinates[i];
            var c2 = null;
            if (i === len - 1) {
                c2 = coordinates[0];
            } else {
                c2 = coordinates[i + 1];
            }
            area += c1.x * c2.y - c1.y * c2.x;
        }
        return Math.abs(area / 2);
    },

    /**
     * Locate a coordinate from the given source coordinate with a x-axis distance and a y-axis distance.
     * @param  {Coordinate} c     - source coordinate
     * @param  {Number} xDist     - x-axis distance
     * @param  {Number} yDist     - y-axis distance
     * @return {Coordinate}
     * @static
     */
    locate: function (c, xDist, yDist) {
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
        return new Coordinate(c.x + xDist, c.y + yDist);
    }
};
