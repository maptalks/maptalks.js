import {
    isNil,
    isString,
    parseJSON,
    isArrayHasData,
    pushIn,
    isNumber
} from '../core/util';
import Marker from './Marker';
import LineString from './LineString';
import Polygon from './Polygon';
import MultiPoint from './MultiPoint';
import MultiLineString from './MultiLineString';
import MultiPolygon from './MultiPolygon';
import GeometryCollection from './GeometryCollection';
import Geometry from './Geometry';
import { GEOJSON_TYPES } from '../core/Constants';
import PromisePolyfill from './../core/Promise';
import { runTaskAsync } from '../core/MicroTask';

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
    * async Convert one or more GeoJSON objects to geometry
    * @param  {String|Object|Object[]} geoJSON - GeoJSON objects or GeoJSON string
    * @param  {Function} [foreachFn=undefined] - callback function for each geometry
    * @param  {Number} [countPerTime=2000] - Number of graphics converted per time
    * @return {Promise}
    * @example
    *  GeoJSON.toGeometryAsync(geoJSON).then(geos=>{
    *    console.log(geos);
    * })
    * */
    toGeometryAsync(geoJSON, foreachFn, countPerTime = 2000) {
        if (isString(geoJSON)) {
            geoJSON = parseJSON(geoJSON);
        }
        return new PromisePolyfill((resolve) => {
            const resultGeos = [];
            if (geoJSON && (Array.isArray(geoJSON) || Array.isArray(geoJSON.features))) {
                const pageSize = isNumber(countPerTime) ? Math.round(countPerTime) : 2000;
                const features = geoJSON.features || geoJSON;
                const count = Math.ceil(features.length / pageSize);
                let page = 1;
                const run = () => {
                    const startIndex = (page - 1) * pageSize, endIndex = (page) * pageSize;
                    const fs = features.slice(startIndex, endIndex);
                    const geos = GeoJSON.toGeometry(fs, foreachFn);
                    page++;
                    return geos;
                };
                runTaskAsync({ count, run }).then((geoList) => {
                    for (let i = 0, len = geoList.length; i < len; i++) {
                        const geo = geoList[i];
                        if (!geo) {
                            continue;
                        }
                        if (Array.isArray(geo)) {
                            pushIn(resultGeos, geo);
                        } else {
                            resultGeos.push(geo);
                        }
                    }
                    resolve(resultGeos);
                });
            } else {
                const geo = GeoJSON.toGeometry(geoJSON, foreachFn);
                resolve(geo);
            }
        });
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
                //circle ellipse etc...
                //规范上geojson里是没有Circle等图形的，但是Circle json等的反序列化有用到该方法
                if (geometries[i].subType) {
                    mGeos.push(Geometry.getJSONClass(geometries[i].subType).fromJSON(geometries[i]));
                } else {
                    mGeos.push(GeoJSON._convert(geometries[i]));
                }
            }
            const result = new GeometryCollection(mGeos);
            if (foreachFn) {
                foreachFn(result);
            }
            return result;
        }
        return null;
    },

    _isGeoJSON(json) {
        if (!json) {
            return false;
        }
        json = json || {};
        //is flat geometries,[geometry,geometry,...]
        if (Array.isArray(json) && json.length) {
            return GeoJSON.isGeoJSON(json[0]);
        }
        const type = json.type;
        if (!type) {
            return false;
        }
        if (GEOJSON_TYPES.indexOf(type) === -1) {
            return false;
        }
        const { features, geometries, geometry, coordinates } = json;

        //Geometry
        if (coordinates && Array.isArray(coordinates)) {
            return true;
        }
        //GeometryCollection
        if (Array.isArray(geometries)) {
            return true;
        }

        //FeatureCollection
        if (Array.isArray(features)) {
            return true;
        }
        //Feature
        if (geometry) {
            const coordinates = geometry.coordinates;
            if (coordinates && Array.isArray(coordinates)) {
                return true;
            }
        }
        return false;

    }
};

export default GeoJSON;
