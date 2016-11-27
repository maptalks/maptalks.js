/**
 * @classdesc
 * GeoJSON utilities
 * @class
 * @category geometry
*  @memberOf maptalks
 * @name GeoJSON
 */
maptalks.GeoJSON = {

    /**
     * Convert one or more GeoJSON objects to a geometry
     * @param  {String|Object|Object[]} json - json objects or json string
     * @return {maptalks.Geometry|maptalks.Geometry[]} a geometry array when input is a FeatureCollection
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
     *  var geometries = maptalks.GeoJSON.toGeometry(collection);
     */
    toGeometry:function (geoJSON) {
        if (maptalks.Util.isString(geoJSON)) {
            geoJSON = maptalks.Util.parseJSON(geoJSON);
        }
        if (maptalks.Util.isArray(geoJSON)) {
            var resultGeos = [];
            for (var i = 0, len = geoJSON.length; i < len; i++) {
                var geo = this._convert(geoJSON[i]);
                if (maptalks.Util.isArray(geo)) {
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
     * Convert one or more maptalks.Coordinate objects to GeoJSON style coordinates
     * @param  {maptalks.Coordinate|maptalks.Coordinate[]} coordinates - coordinates to convert
     * @return {Number[]|Number[][]}
     * @example
     * // result is [[100,0], [101,1]]
     * var numCoords = maptalks.GeoJSON.toNumberArrays([new maptalks.Coordinate(100,0), new maptalks.Coordinate(101,1)]);
     */
    toNumberArrays:function (coordinates) {
        if (!maptalks.Util.isArray(coordinates)) {
            return [coordinates.x, coordinates.y];
        }
        return maptalks.Util.mapArrayRecursively(coordinates, function (coord) {
            return [coord.x, coord.y];
        });
    },

    /**
     * Convert one or more GeoJSON style coordiantes to maptalks.Coordinate objects
     * @param  {Number[]|Number[][]} coordinates - coordinates to convert
     * @return {maptalks.Coordinate|maptalks.Coordinate[]}
     * @example
     * var coordinates = maptalks.GeoJSON.toCoordinates([[100,0], [101,1]]);
     */
    toCoordinates:function (coordinates) {
        if (maptalks.Util.isNumber(coordinates[0]) && maptalks.Util.isNumber(coordinates[1])) {
            return new maptalks.Coordinate(coordinates);
        }
        var result = [];
        for (var i = 0, len = coordinates.length; i < len; i++) {
            var child = coordinates[i];
            if (maptalks.Util.isArray(child)) {
                if (maptalks.Util.isNumber(child[0])) {
                    result.push(new maptalks.Coordinate(child));
                } else {
                    result.push(this.toCoordinates(child));
                }
            } else {
                result.push(new maptalks.Coordinate(child));
            }
        }
        return result;
    },

    /**
     * Convert single GeoJSON object
     * @param  {Object} geoJSONObj - a GeoJSON object
     * @return {maptalks.Geometry}
     * @private
     */
    _convert:function (json) {
        if (!json || maptalks.Util.isNil(json['type'])) {
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
            var result = maptalks.GeoJSON.toGeometry(features);
            return result;
        } else if (maptalks.Util.indexOfArray(type,
            ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']) >= 0) {
            var clazz = (type === 'Point' ? 'Marker' : type);
            return new maptalks[clazz](json['coordinates'], options);
        } else if (type === 'GeometryCollection') {
            var geometries = json['geometries'];
            if (!maptalks.Util.isArrayHasData(geometries)) {
                return new maptalks.GeometryCollection();
            }
            var mGeos = [];
            var size = geometries.length;
            for (var i = 0; i < size; i++) {
                mGeos.push(this._convert(geometries[i]));
            }
            return new maptalks.GeometryCollection(mGeos, options);
        } else if (type === 'Circle') {
            return new maptalks.Circle(json['coordinates'], json['radius'], options);
        } else if (type === 'Ellipse' || type === 'Rectangle') {
            return new maptalks[type](json['coordinates'], json['width'], json['height'], options);
        } else if (type === 'Sector') {
            return new maptalks.Sector(json['coordinates'], json['radius'], json['startAngle'], json['endAngle'], options);
        }
        return null;
    }
};
