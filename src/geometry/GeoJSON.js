import {
    isNil,
    isArray,
    isNumber,
    isString,
    parseJSON,
    indexOfArray,
    isArrayHasData,
    mapArrayRecursively
} from 'core/util';
import Coordinate from 'geo/Coordinate';
import { Marker } from './Marker';
import { LineString } from './LineString';
import { Polygon } from './Polygon';
import { MultiPoint } from './MultiPoint';
import { MultiLineString } from './MultiLineString';
import { MultiPolygon } from './MultiPolygon';
import { GeometryCollection } from './GeometryCollection';
import { Sector } from './Sector';
import { Circle } from './Circle';
import { Ellipse } from './Ellipse';
import { Rectangle } from './Rectangle';

const types = {
    'Marker': Marker.constructor,
    'LineString': LineString.constructor,
    'Polygon': Polygon.constructor,
    'MultiPoint': MultiPoint.constructor,
    'MultiLineString': MultiLineString.constructor,
    'MultiPolygon': MultiPolygon.constructor
};

/**
 * @classdesc
 * GeoJSON utilities
 * @class
 * @category geometry
 *  @memberOf maptalks
 * @name GeoJSON
 */
const GeoJSON = {

    /**
     * Convert one or more GeoJSON objects to a geometry
     * @param  {String|Object|Object[]} json - json objects or json string
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
     *  // a geometry array.
     *  var geometries = GeoJSON.toGeometry(collection);
     */
    toGeometry: function (geoJSON) {
        if (isString(geoJSON)) {
            geoJSON = parseJSON(geoJSON);
        }
        if (isArray(geoJSON)) {
            var resultGeos = [];
            for (var i = 0, len = geoJSON.length; i < len; i++) {
                var geo = this._convert(geoJSON[i]);
                if (isArray(geo)) {
                    resultGeos = resultGeos.concat(geo);
                } else {
                    resultGeos.push(geo);
                }
            }
            return resultGeos;
        } else {
            var resultGeo = this._convert(geoJSON);
            return resultGeo;
        }

    },

    /**
     * Convert one or more Coordinate objects to GeoJSON style coordinates
     * @param  {Coordinate|Coordinate[]} coordinates - coordinates to convert
     * @return {Number[]|Number[][]}
     * @example
     * // result is [[100,0], [101,1]]
     * var numCoords = GeoJSON.toNumberArrays([new Coordinate(100,0), new Coordinate(101,1)]);
     */
    toNumberArrays: function (coordinates) {
        if (!isArray(coordinates)) {
            return [coordinates.x, coordinates.y];
        }
        return mapArrayRecursively(coordinates, function (coord) {
            return [coord.x, coord.y];
        });
    },

    /**
     * Convert one or more GeoJSON style coordiantes to Coordinate objects
     * @param  {Number[]|Number[][]} coordinates - coordinates to convert
     * @return {Coordinate|Coordinate[]}
     * @example
     * var coordinates = GeoJSON.toCoordinates([[100,0], [101,1]]);
     */
    toCoordinates: function (coordinates) {
        if (isNumber(coordinates[0]) && isNumber(coordinates[1])) {
            return new Coordinate(coordinates);
        }
        var result = [];
        for (var i = 0, len = coordinates.length; i < len; i++) {
            var child = coordinates[i];
            if (isArray(child)) {
                if (isNumber(child[0])) {
                    result.push(new Coordinate(child));
                } else {
                    result.push(this.toCoordinates(child));
                }
            } else {
                result.push(new Coordinate(child));
            }
        }
        return result;
    },

    /**
     * Convert single GeoJSON object
     * @param  {Object} geoJSONObj - a GeoJSON object
     * @return {Geometry}
     * @private
     */
    _convert: function (json) {
        if (!json || isNil(json['type'])) {
            return null;
        }
        var options = {};

        var type = json['type'];
        if (type === 'Feature') {
            var g = json['geometry'];
            var geometry = this._convert(g);
            if (!geometry) {
                return null;
            }
            geometry.setId(json['id']);
            geometry.setProperties(json['properties']);
            return geometry;
        } else if (type === 'FeatureCollection') {
            var features = json['features'];
            if (!features) {
                return null;
            }
            //返回geometry数组
            var result = GeoJSON.toGeometry(features);
            return result;
        } else if (indexOfArray(type, ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']) >= 0) {
            var clazz = (type === 'Point' ? 'Marker' : type);
            return new types[clazz](json['coordinates'], options);
        } else if (type === 'GeometryCollection') {
            var geometries = json['geometries'];
            if (!isArrayHasData(geometries)) {
                return new GeometryCollection();
            }
            var mGeos = [];
            var size = geometries.length;
            for (var i = 0; i < size; i++) {
                mGeos.push(this._convert(geometries[i]));
            }
            return new GeometryCollection(mGeos, options);
        } else if (type === 'Circle') {
            return new Circle(json['coordinates'], json['radius'], options);
        } else if (type === 'Ellipse') {
            return new Ellipse(json['coordinates'], json['width'], json['height']);
        } else if (type === 'Rectangle') {
            return new Rectangle(json['coordinates'], json['width'], json['height'], options);
        } else if (type === 'Sector') {
            return new Sector(json['coordinates'], json['radius'], json['startAngle'], json['endAngle'], options);
        }
        return null;
    }
};

export { GeoJSON };
export default GeoJSON;
