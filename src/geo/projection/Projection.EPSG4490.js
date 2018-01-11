import { extend } from '../../core/util';
import PROJ4326 from './Projection.EPSG4326';

/**
 * For CGCS2000
 *
 * @class
 * @category geo
 * @protected
 * @memberOf projection
 * @name EPSG4490
 * @mixes projection.EPSG4326
 * @mixes measurer.WGS84Sphere
 */
export default extend({}, PROJ4326, /** @lends projection.EPSG4490 */ {
    /**
     * "EPSG:4490", Code of the projection
     * @type {String}
     * @constant
     */
    code: 'EPSG:4490'
});
