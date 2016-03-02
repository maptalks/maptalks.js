/**
 * GeoJSON utilities
 * @class
 * @category geometry
*  @memberOf maptalks
 * @name GeoJSON
 */
Z.GeoJSON={

        /**
         * Convert one or more GeoJSON objects to a geometry
         * @param  {String|Object|Object[]} json - json objects or json string
         * @return {maptalks.Geometry|maptalks.Geometry[]}
         */
        fromGeoJSON:function(geoJSON) {
            if (Z.Util.isString(geoJSON)) {
                geoJSON = Z.Util.parseJSON(geoJSON);
            }
            if (Z.Util.isArray(geoJSON)) {
                var resultGeos = [];
                for (var i=0,len=geoJSON.length;i<len;i++) {
                    var geo = this._fromGeoJSONInstance(geoJSON[i]);
                    resultGeos.push(geo);
                }
                return resultGeos;
            } else {
                var resultGeo = this._fromGeoJSONInstance(geoJSON);
                return resultGeo;
            }

        },

        /**
         * Convert one or more maptalks.Coordinate objects to GeoJSON style coordinates
         * @param  {maptalks.Coordinate|maptalks.Coordinate[]} coordinates - coordinates to convert
         * @return {Number[]|Number[][]}
         * @example
         * // result is [[100,0], [101,1]]
         * var jsonCoords = maptalks.GeoJSON.toGeoJSONCoordinates([new maptalks.Coordinate(100,0), new maptalks.Coordinate(101,1)]);
         */
        toGeoJSONCoordinates:function(coordinates) {
            if (!Z.Util.isArray(coordinates)) {
                return [coordinates.x, coordinates.y];
            }
            return Z.Util.eachInArray(coordinates, this, function(coord) {
                return [coord.x, coord.y];
            });
        },

        /**
         * Convert one or more GeoJSON style coordiantes to maptalks.Coordinate objects
         * @param  {Number[]|Number[][]} coordinates - coordinates to convert
         * @return {maptalks.Coordinate|maptalks.Coordinate[]}
         */
        fromGeoJSONCoordinates:function(coordinates) {
            if (Z.Util.isNumber(coordinates[0]) && Z.Util.isNumber(coordinates[1])) {
                return new Z.Coordinate(coordinates);
            }
            var result = [];
            for (var i=0, len=coordinates.length;i<len;i++) {
                var child = coordinates[i];
                if (Z.Util.isArray(child)) {
                    if (Z.Util.isNumber(child[0])) {
                        result.push(new Z.Coordinate(child));
                    } else {
                        result.push(this.fromGeoJSONCoordinates(child));
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
        _fromGeoJSONInstance:function(geoJSONObj) {
            if (!geoJSONObj || Z.Util.isNil(geoJSONObj['type'])) {
                return null;
            }
            var options = {};

            var type = geoJSONObj['type'];
            if ('Feature' === type) {
                var geoJSONGeo = geoJSONObj['geometry'];
                var geometry = this._fromGeoJSONInstance(geoJSONGeo);
                if (!geometry) {
                    return null;
                }
                geometry.setId(geoJSONObj['id']);
                geometry.setProperties(geoJSONObj['properties']);
                return geometry;
            } else if ('FeatureCollection' === type) {
                var features = geoJSONObj['features'];
                if (!features) {
                    return null;
                }
                //返回geometry数组
                var result = this.fromGeoJSON(features);
                return result;
            } else if (Z.Util.searchInArray(type,
                ['Point','LineString','Polygon','MultiPoint','MultiLineString','MultiPolygon']) >= 0) {
                var clazz = (type === 'Point'?'Marker':type);
                return new Z[clazz](geoJSONObj['coordinates'],options);
            } else if ('GeometryCollection' === type) {
                var geometries = geoJSONObj['geometries'];
                if (!Z.Util.isArrayHasData(geometries)) {
                    return new Z.GeometryCollection();
                }
                var mGeos = [];
                var size = geometries.length;
                for (var i = 0; i < size; i++) {
                    mGeos.push(this._fromGeoJSONInstance(geometries[i]));
                }
                return new Z.GeometryCollection(mGeos,options);
            } else if ('Circle' === type) {
                return new Z.Circle(geoJSONObj['coordinates'], geoJSONObj['radius'],options);
            } else if ('Ellipse' === type || 'Rectangle' === type) {
                return new Z[type](geoJSONObj['coordinates'], geoJSONObj['width'], geoJSONObj['height'],options);
            } else if ('Sector' === type) {
                return new Z.Sector(geoJSONObj['coordinates'], geoJSONObj['radius'], geoJSONObj['startAngle'], geoJSONObj['endAngle'],options);
            }
            return null;
        }
};
