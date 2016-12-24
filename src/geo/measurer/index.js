/**
 * Utilities with measurers.<br>
 * Measurer is a object containing methods for geographical computations such as length and area measuring, etc.
 * @class
 * @category geo
 * @protected
 */

import { isNil, hasOwn } from 'core/util';
import { Identity } from './Identity';
import { WGS84Sphere, BaiduSphere } from './Sphere';

export * from './Identity';
export * from './Sphere';

const measurers = {};

function registerMeasurer(m) {
    measurers[m.measure] = m;
}

registerMeasurer(Identity);
registerMeasurer(WGS84Sphere);
registerMeasurer(BaiduSphere);

/**
 * The default measurer: WGS84Sphere
 * @type {Object}
 */
export const DEFAULT = WGS84Sphere;

/**
 * Get a measurer instance.
 * @param  {String} name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
 * @return {Object} a measurer object
 */
export function getInstance(name) {
    if (!name) {
        return DEFAULT;
    }
    for (var p in measurers) {
        if (hasOwn(measurers, p)) {
            var mName = measurers[p]['measure'];
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

/**
 * Whether the measurer is based on earth sphere
 * @param  {Object}  m
 * @return {Boolean}
 */
export function isSphere(measure) {
    return !isNil(measure.sphere);
}
