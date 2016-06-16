/**
 * GeoJSON utilities
 * @class
 * @category geometry
*  @memberOf maptalks
 * @name GeoJSON
 */
Z.GeoJSON = {

    /**
     * Convert one or more GeoJSON objects to a geometry
     * @param  {String|Object|Object[]} json - json objects or json string
     * @return {maptalks.Geometry|maptalks.Geometry[]}
     */
    toGeometry:function (geoJSON) {
        if (Z.Util.isString(geoJSON)) {
            geoJSON = Z.Util.parseJSON(geoJSON);
        }
        if (Z.Util.isArray(geoJSON)) {
            var resultGeos = [];
            for (var i = 0, len = geoJSON.length; i < len; i++) {
                var geo = this._convert(geoJSON[i]);
                if (Z.Util.isArray(geo)) {
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
     * var jsonCoords = maptalks.GeoJSON.toNumberArrays([new maptalks.Coordinate(100,0), new maptalks.Coordinate(101,1)]);
     */
    toNumberArrays:function (coordinates) {
        if (!Z.Util.isArray(coordinates)) {
            return [coordinates.x, coordinates.y];
        }
        return Z.Util.mapArrayRecursively(coordinates, function (coord) {
            return [coord.x, coord.y];
        });
    },

    /**
     * Convert one or more GeoJSON style coordiantes to maptalks.Coordinate objects
     * @param  {Number[]|Number[][]} coordinates - coordinates to convert
     * @return {maptalks.Coordinate|maptalks.Coordinate[]}
     */
    toCoordinates:function (coordinates) {
        if (Z.Util.isNumber(coordinates[0]) && Z.Util.isNumber(coordinates[1])) {
            return new Z.Coordinate(coordinates);
        }
        var result = [];
        for (var i = 0, len = coordinates.length; i < len; i++) {
            var child = coordinates[i];
            if (Z.Util.isArray(child)) {
                if (Z.Util.isNumber(child[0])) {
                    result.push(new Z.Coordinate(child));
                } else {
                    result.push(this.toCoordinates(child));
                }
            } else {
                result.push(new Z.Coordinate(child));
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
        if (!json || Z.Util.isNil(json['type'])) {
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
            var result = Z.GeoJSON.toGeometry(features);
            return result;
        } else if (Z.Util.indexOfArray(type,
            ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']) >= 0) {
            var clazz = (type === 'Point' ? 'Marker' : type);
            return new Z[clazz](json['coordinates'], options);
        } else if (type === 'GeometryCollection') {
            var geometries = json['geometries'];
            if (!Z.Util.isArrayHasData(geometries)) {
                return new Z.GeometryCollection();
            }
            var mGeos = [];
            var size = geometries.length;
            for (var i = 0; i < size; i++) {
                mGeos.push(this._convert(geometries[i]));
            }
            return new Z.GeometryCollection(mGeos, options);
        } else if (type === 'Circle') {
            return new Z.Circle(json['coordinates'], json['radius'], options);
        } else if (type === 'Ellipse' || type === 'Rectangle') {
            return new Z[type](json['coordinates'], json['width'], json['height'], options);
        } else if (type === 'Sector') {
            return new Z.Sector(json['coordinates'], json['radius'], json['startAngle'], json['endAngle'], options);
        }
        return null;
    }
};
