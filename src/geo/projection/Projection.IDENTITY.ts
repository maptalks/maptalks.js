import { extend } from '../../core/util';
import Common from './Projection';
import { Identity } from '../measurer';

/**
 * A projection based on Cartesian coordinate system.<br>
 * This projection maps x, y directly, it is useful for maps of flat surfaces (e.g. indoor maps, game maps).
 * @class
 * @category geo
 * @protected
 * @memberOf projection
 * @name IDENTITY
 * @mixes projection.Common
 * @mixes measurer.Identity
 */
export default extend({}, Common, /** @lends projection.IDENTITY */ {
    /**
     * "IDENTITY", Code of the projection
     * @type {String}
     * @constant
     */
    code: 'IDENTITY',
    project: function (p, out) {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return p.copy();
    },
    unproject: function (p, out) {
        if (out) {
            out.x = p.x;
            out.y = p.y;
            return out;
        }
        return p.copy();
    }
}, Identity);
