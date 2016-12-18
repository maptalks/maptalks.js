export * from './Projection';
export * from './Projection.EPSG4326';
export * from './Projection.Baidu';
export * from './Projection.EPSG3857';
export * from './Projection.IDENTITY';

import EPSG3857 from './Projection.EPSG3857';

export const DEFAULT = EPSG3857;
