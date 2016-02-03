/**
 * GeoJSON转化工具类
 * @class maptalks.GeoJSON
 * @author Maptalks Team
 */
Z.GeoJSON={

        /**
         * 将geoJSON字符串或geoJSON对象转化为Geometry对象
         * @param  {String | Object | [Object]} json json对象
         * @return {Geometry | [Geometry]}      转化的Geometry对象或数组
         * @expose
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
         * 将Coordinate数组转化为GeoJSON坐标数组
         * @param  {[Coordinate]} coordinates Coordinate数组
         * @return {number[]..}               GeoJSON数组
         * @expose
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
         * 将GeoJSON坐标数组转化为Coordinate数组
         * @param  {[type]} coordinates [description]
         * @return {[type]}             [description]
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
         * 解析单个GeoJSON对象,输出为Geometry
         * @param  {[type]} geoJSONObj [description]
         * @return {[type]}            [description]
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
