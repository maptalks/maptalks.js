import {
    isNil,
    isArray,
    isString,
    parseJSON,
    indexOfArray,
    isArrayHasData
} from 'core/util';
import { Geometry } from './Geometry';
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
    'Marker': Marker,
    'LineString': LineString,
    'Polygon': Polygon,
    'MultiPoint': MultiPoint,
    'MultiLineString': MultiLineString,
    'MultiPolygon': MultiPolygon
};

/**
 * @classdesc
 * GeoJSON utilities
 * @class
 * @category geometry
 *  @memberOf maptalks
 * @name GeoJSON
 */
export const GeoJSON = {

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

/**
 * Produce a geometry from one or more [profile json]{@link Geometry#toJSON} or GeoJSON.
 * @static
 * @param  {Object} json - a geometry's profile json or a geojson
 * @return {Geometry} geometry
 * @example
 * var profile = {
        "feature": {
              "type": "Feature",
              "id" : "point1",
              "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
              "properties": {"prop0": "value0"}
        },
        //construct options.
        "options":{
            "draggable" : true
        },
        //symbol
        "symbol":{
            "markerFile"  : "http://foo.com/icon.png",
            "markerWidth" : 20,
            "markerHeight": 20
        }
    };
    var marker = Geometry.fromJSON(profile);
 */
Geometry.fromJSON = function (json) {
    if (isArray(json)) {
        var result = [],
            c;
        for (var i = 0, len = json.length; i < len; i++) {
            c = Geometry.fromJSON(json[i]);
            if (isArray(json)) {
                result = result.concat(c);
            } else {
                result.push(c);
            }
        }
        return result;
    }

    if (json && !json['feature']) {
        return GeoJSON.toGeometry(json);
    }
    var geometry;
    if (json['subType']) {
        geometry = maptalks[json['subType']].fromJSON(json);
        if (!isNil(json['feature']['id'])) {
            geometry.setId(json['feature']['id']);
        }
    } else {
        var feature = json['feature'];
        geometry = GeoJSON.toGeometry(feature);
        if (json['options']) {
            geometry.config(json['options']);
        }
    }
    if (json['symbol']) {
        geometry.setSymbol(json['symbol']);
    }
    if (json['infoWindow']) {
        geometry.setInfoWindow(json['infoWindow']);
    }
    return geometry;
};
