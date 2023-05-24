import { extend } from '../../core/util';
import Common from './Projection';
import Coordinate from '../Coordinate';
import { WGS84Sphere } from '../measurer';

/**
 * A common CRS among GIS enthusiasts. Uses simple Equirectangular projection.
 *
 * @class
 * @category geo
 * @protected
 * @memberOf projection
 * @name EPSG4326
 * @mixes projection.Common
 * @mixes measurer.WGS84Sphere
 */
export default extend({}, Common, /** @lends projection.EPSG4326 */ {
    /**
     * "EPSG:4326", Code of the projection
     * @type {String}
     * @constant
     */
    code: 'EPSG:4326',
    project: function (p, out) {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return new Coordinate(p);
    },
    unproject: function (p, out) {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return new Coordinate(p);
    }
}, WGS84Sphere);
