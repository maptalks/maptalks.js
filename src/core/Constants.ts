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

/**
 * Symbol properties containing external resources
 */
export const RESOURCE_PROPERTIES = [
    'markerFile', 'polygonPatternFile', 'linePatternFile', 'markerFillPatternFile', 'markerLinePatternFile'
];

/**
 * Corresponding size properties for the above resource properties
 */
export const RESOURCE_SIZE_PROPERTIES = [
    ['markerWidth', 'markerHeight'],
    [],
    [null, 'lineWidth'],
    [],
    [null, 'markerLineWidth']
];

/**
 * numeric symbol properties
 */
export const NUMERICAL_PROPERTIES = {
    'lineWidth': 1,
    'lineOpacity': 1,
    'lineDx': 1,
    'lineDy': 1,
    'polygonOpacity': 1,
    'markerWidth': 1,
    'markerHeight': 1,
    'markerDx': 1,
    'markerDy': 1,
    'markerOpacity': 1,
    'markerFillOpacity': 1,
    'markerLineWidth': 1,
    'markerLineOpacity': 1,
    'textSize': 1,
    'textOpacity': 1,
    'textHaloRadius': 1,
    'textWrapWidth': 1,
    'textLineSpacing': 1,
    'textDx': 1,
    'textDy': 1
};

/**
 *  color symbol properties
 */
export const COLOR_PROPERTIES = [
    'lineColor', 'polygonFill', 'markerFill', 'markerLineColor', 'textFill'
];

export const DEFAULT_TEXT_SIZE = 14;
