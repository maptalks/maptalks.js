/** @namespace measurer */

import { hasOwn } from '../../core/util';
import Identity from './Identity';
import { WGS84Sphere, BaiduSphere } from './Sphere';

export { Identity };
export * from './Sphere';

/**
 * Default measurer, [WGS84Sphere]{@link measurer.WGS84Sphere}
 *
 * @class
 * @category geo
 * @protected
 * @memberOf measurer
 * @name DEFAULT
 * @extends measurer.WGS84Sphere
 */
export const DEFAULT = WGS84Sphere;


const measurers = {};

function registerMeasurer(m) {
    measurers[m.measure] = m;
}

registerMeasurer(Identity);
registerMeasurer(WGS84Sphere);
registerMeasurer(BaiduSphere);

/**
 * @classdesc
 * Utilities with measurers. It is static and should not be initiated.<br>
 * Measurer provides methods for geographical computations such as length and area measuring, etc.
 * @class
 * @name Measurer
 * @memberOf measurer
 * @category geo
 */
export const Measurer = {
    /**
     * Get a measurer instance.
     * @param  {String} name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
     * @return {Object} a measurer object
     * @function measurer.Measurer.getInstance
     */
    getInstance(name) {
        if (!name) {
            return DEFAULT;
        }
        for (const p in measurers) {
            if (hasOwn(measurers, p)) {
                const mName = measurers[p]['measure'];
                if (!mName) {
                    continue;
                }
                if (name.toLowerCase() === mName.toLowerCase()) {
                    return measurers[p];
                }
            }
        }
        return null;
    }
};

