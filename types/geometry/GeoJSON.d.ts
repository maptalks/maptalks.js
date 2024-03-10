import Geometry from './Geometry';
/**
 * GeoJSON utilities
 * @class
 * @category geometry
 * @name GeoJSON
 */
declare const GeoJSON: {
    /**
     * Convert one or more GeoJSON objects to geometry
     * @param  {String|Object|Object[]} geoJSON - GeoJSON objects or GeoJSON string
     * @param  {Function} [foreachFn=undefined] - callback function for each geometry
     * @return {Geometry|Geometry[]} a geometry array when input is a FeatureCollection
     * @example
     * var collection = {
     *      "type": "FeatureCollection",
     *      "features": [
     *          { "type": "Feature",
     *            "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
     *            "properties": {"prop0": "value0"}
     *           },
     *           { "type": "Feature",
     *             "geometry": {
     *                 "type": "LineString",
     *                 "coordinates": [
     *                     [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
     *                 ]
     *             },
     *             "properties": {
     *                 "prop0": "value0",
     *                 "prop1": 0.0
     *             }
     *           },
     *           { "type": "Feature",
     *             "geometry": {
     *                 "type": "Polygon",
     *                 "coordinates": [
     *                     [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
     *                       [100.0, 1.0], [100.0, 0.0] ]
     *                 ]
     *             },
     *             "properties": {
     *                 "prop0": "value0",
     *                 "prop1": {"this": "that"}
     *             }
     *          }
     *      ]
     *  }
     *  // A geometry array.
     *  const geometries = GeoJSON.toGeometry(collection, geometry => { geometry.config('draggable', true); });
     */
    toGeometry: (geoJSON: any, foreachFn?: any) => Geometry | Array<Geometry>;
    /**
     * Convert single GeoJSON object
     * @param  {Object} geoJSONObj - a GeoJSON object
     * @return {Geometry}
     * @private
     */
    _convert: (json: any, foreachFn?: any) => any;
};
export default GeoJSON;
