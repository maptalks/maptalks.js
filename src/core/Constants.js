/**
 * INTERNAL_LAYER_PREFIX The id prefix of internal layers
 * @global
 */
export const INTERNAL_LAYER_PREFIX = '_maptalks__internal_layer_';

export const GEOMETRY_COLLECTION_TYPES = [
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
];

export const GEOJSON_TYPES = ['FeatureCollection', 'Feature', 'Point', 'LineString', 'Polygon'].concat(GEOMETRY_COLLECTION_TYPES);
