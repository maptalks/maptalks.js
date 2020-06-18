import {
    isNil,
    isString,
    parseJSON,
    isArrayHasData,
    pushIn
} from '../core/util';
import Marker from './Marker';
import LineString from './LineString';
import Polygon from './Polygon';
import MultiPoint from './MultiPoint';
import MultiLineString from './MultiLineString';
import MultiPolygon from './MultiPolygon';
import GeometryCollection from './GeometryCollection';

const types = {
    'Marker': Marker,
    'LineString': LineString,
    'Polygon': Polygon,
    'MultiPoint': MultiPoint,
    'MultiLineString': MultiLineString,
    'MultiPolygon': MultiPolygon
};

/**
 * GeoJSON utilities
 * @class
 * @category geometry
 * @name GeoJSON
 */
const GeoJSON = {

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
    toGeometry: function (geoJSON, foreachFn) {
        if (isString(geoJSON)) {
            geoJSON = parseJSON(geoJSON);
        }
        if (Array.isArray(geoJSON)) {
            const resultGeos = [];
            for (let i = 0, len = geoJSON.length; i < len; i++) {
                const geo = GeoJSON._convert(geoJSON[i], foreachFn);
                if (Array.isArray(geo)) {
                    pushIn(resultGeos, geo);
                } else {
                    resultGeos.push(geo);
                }
            }
            return resultGeos;
        } else {
            const resultGeo = GeoJSON._convert(geoJSON, foreachFn);
            return resultGeo;
        }

    },

    /**
     * Convert single GeoJSON object
     * @param  {Object} geoJSONObj - a GeoJSON object
     * @return {Geometry}
     * @private
     */
    _convert: function (json, foreachFn) {
        if (!json || isNil(json['type'])) {
            return null;
        }

        const type = json['type'];
        if (type === 'Feature') {
            const g = json['geometry'];
            const geometry = GeoJSON._convert(g);
            if (!geometry) {
                return null;
            }
            geometry.setId(json['id']);
            geometry.setProperties(json['properties']);
            if (foreachFn) {
                foreachFn(geometry);
            }
            return geometry;
        } else if (type === 'FeatureCollection') {
            const features = json['features'];
            if (!features) {
                return null;
            }
            return GeoJSON.toGeometry(features, foreachFn);
        } else if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].indexOf(type) >= 0) {
            const clazz = (type === 'Point' ? 'Marker' : type);
            const result = new types[clazz](json['coordinates']);
            if (foreachFn) {
                foreachFn(result);
            }
            return result;
        } else if (type === 'GeometryCollection') {
            const geometries = json['geometries'];
            if (!isArrayHasData(geometries)) {
                const result = new GeometryCollection();
                if (foreachFn) {
                    foreachFn(result);
                }
                return result;
            }
            const mGeos = [];
            const size = geometries.length;
            for (let i = 0; i < size; i++) {
                mGeos.push(GeoJSON._convert(geometries[i]));
            }
            const result = new GeometryCollection(mGeos);
            if (foreachFn) {
                foreachFn(result);
            }
            return result;
        }
        return null;
    }
};

export default GeoJSON;
