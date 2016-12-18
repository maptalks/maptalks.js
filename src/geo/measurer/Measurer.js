import { isNil, hasOwn } from 'core/util';

/**
 * @namespace
 * @protected
 */
const measurer = { };
export default measurer;
export function registerMeasurer(m) {
    measurer[m.measure] = m;
}

/**
 * Utilities with measurers.<br>
 * Measurer is a object containing methods for geographical computations such as length and area measuring, etc.
 * @class
 * @category geo
 * @protected
 */
export const MeasurerUtil = {
    /**
     * Get a measurer instance.
     * @param  {String} name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
     * @return {Object} a measurer object
     */
    getInstance: function (name) {
        if (!name) {
            return MeasurerUtil.DEFAULT;
        }
        for (var p in measurer) {
            if (hasOwn(measurer, p)) {
                var mName = measurer[p]['measure'];
                if (!mName) {
                    continue;
                }
                if (name.toLowerCase() === mName.toLowerCase()) {
                    return measurer[p];
                }
            }
        }
        return null;
    },

    /**
     * Whether the measurer is based on earth sphere
     * @param  {Object}  m
     * @return {Boolean}
     */
    isSphere: function (m) {
        return !isNil(m.sphere);
    },

    /**
     * The default measurer: WGS84Sphere
     * @type {Object}
     */
    DEFAULT: measurer.WGS84Sphere
};
