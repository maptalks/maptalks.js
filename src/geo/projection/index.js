/** @namespace projection */

import EPSG3857 from './Projection.EPSG3857';

export { default as EPSG4326 } from './Projection.EPSG4326';
export { default as EPSG4490 } from './Projection.EPSG4490';
export { default as BAIDU } from './Projection.Baidu';
export { default as IDENTITY } from './Projection.IDENTITY';
export { EPSG3857 };
export { default as Common } from './Projection';
/**
 * Default projection, [EPSG3857]{@link projection.EPSG3857}
 *
 * @class
 * @category geo
 * @protected
 * @memberOf projection
 * @name DEFAULT
 * @extends projection.EPSG3857
 */
export const DEFAULT = EPSG3857;
