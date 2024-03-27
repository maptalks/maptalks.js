import { extend } from '../../core/util';
import PROJ9807 from './Projection.EPSG9807';

/**
 * Universal Traverse Mercator projection
 *
 * @class
 * @category geo
 * @protected
 * @memberOf projection
 * @name EPSG4490
 * @mixes projection.EPSG4326
 * @mixes measurer.WGS84Sphere
 */
export default extend({}, PROJ9807, /** @lends projection.EPSG4490 */ {
    /**
     * "EPSG:4490", Code of the projection
     * @type {String}
     * @constant
     */
    code: 'utm',
    aliases: [],
    create(params) {
        const P = {};
        let zone = parseInt(params.zone);
        P.falseNorthing = params.south ? 10000000 : 0;
        P.falseEasting = 500000;
        if (zone > 0 && zone <= 60) {
            zone--;
        } else {
            throw new Error('zone must be > 0 and <= 60.');
        }
        P.centralMeridian = (zone + 0.5) * 6 - 180;
        P.scaleFactor = 0.9996;
        return PROJ9807.create(P);
    }
});
