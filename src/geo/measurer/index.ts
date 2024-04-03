/** @namespace measurer */

import { hasOwn } from '../../core/util/common';
import Identity, { type IdentityMeasurerType } from './Identity';
import { WGS84Sphere, BaiduSphere, type WGS84SphereType, type BaiduSphereType } from './Sphere';

export { Identity, IdentityMeasurerType };
export * from './Sphere';

/**
 * 默认 measurer, [WGS84Sphere]{@link WGS84Sphere}
 * @english
 * Default measurer, [WGS84Sphere]{@link WGS84Sphere}
 *
 * @category geo
 * @protected
 * @group measurer
 * @module DEFAULT
 * {@inheritDoc measurer.WGS84Sphere}
 */
export const DEFAULT = WGS84Sphere;


const measurers: Record<string, IdentityMeasurerType | WGS84SphereType | BaiduSphereType> = {};

function registerMeasurer(m: IdentityMeasurerType | WGS84SphereType | BaiduSphereType) {
    measurers[m.measure] = m;
}

registerMeasurer(Identity);
registerMeasurer(WGS84Sphere);
registerMeasurer(BaiduSphere);

/**
 * 带有测量功能的方法，不能直接初始化。
 * Measurer提供了地理计算的方法，例如长度和面积测量等。
 *
 * @english
 * Utilities with measurers. It is static and should not be initiated.<br>
 * Measurer provides methods for geographical computations such as length and area measuring, etc.
 * @module Measurer
 * @group measurer
 * @category geo
 */
export const Measurer = {
    /**
     * 获取量测计算的实例
     *
     * @english
     * Get a measurer instance.
     * @param name - code of the measurer: 'EPSG:4326', 'Identity', 'BAIDU'
     * @returns a measurer object
     * @function Measurer.getInstance
     */
    getInstance(name?: string): IdentityMeasurerType | WGS84SphereType | BaiduSphereType {
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

