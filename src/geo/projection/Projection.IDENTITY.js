import { extend } from 'core/util';
import Common from './Projection';
import measurer from '../measurer/Measurer';

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
const IDENTITY = extend({}, Common, /** @lends projection.IDENTITY */ {
    /**
     * "IDENTITY", Code of the projection, used by [View]{@link View} to get projection instance.
     * @type {String}
     * @constant
     */
    code: 'IDENTITY',
    project: function (p) {
        return p.copy();
    },
    unproject: function (p) {
        return p.copy();
    }
}, measurer.Identity);

export default IDENTITY;
