/** @namespace projection */

import EPSG3857, { type EPSG3857ProjectionType } from './Projection.EPSG3857';

export { default as EPSG4326, EPSG4326ProjectionType } from './Projection.EPSG4326';
export { default as EPSG9807, EPSG9807ProjectionParams, EPSG9807ProjectionType } from './Projection.EPSG9807';
export { default as UTM, UTMProjectionParams, UTMProjectionType } from './Projection.UTM';
export { default as BAIDU, BAIDUProjectionType } from './Projection.Baidu';
export { default as IDENTITY, IdentityProjectionType } from './Projection.IDENTITY';
export { EPSG3857, EPSG3857ProjectionType };
export { default as Common, CommonProjectionType } from './Projection';

/**
 * 默认投影, [EPSG3857]{@link projection.EPSG3857}
 * @english
 * Default projection, [EPSG3857]{@link projection.EPSG3857}
 *
 * @category geo
 * @protected
 * @group projection
 * @module DEFAULT
 * {@inheritDoc projection.EPSG3857}
 */
export const DEFAULT = EPSG3857;
